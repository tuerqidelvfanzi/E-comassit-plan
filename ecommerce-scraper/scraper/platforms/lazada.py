"""
Lazada 本地 fetcher —— 完整实现。

Lazada 反爬特点：
- 阿里系海外版，技术栈类似淘宝
- 公开商品页 SSR，HTTP 可抓
- 价格在 __module.data 里
- 不同国家站点结构略有差异
"""

from __future__ import annotations

import json
import re
from datetime import datetime
from typing import Optional

import httpx

from scraper.fetcher import Fetcher
from scraper.logging import log
from scraper.result import ProductResult, Source, StockStatus


DEFAULT_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)


class LazadaLocalFetcher(Fetcher):
    """Lazada 本地 fetcher"""

    name = "lazada-local"
    source = Source.LOCAL

    def __init__(self, *, proxy: Optional[str] = None, timeout: float = 30.0):
        self.proxy = proxy
        self.timeout = timeout

    async def fetch(self, url: str, **kwargs) -> ProductResult:
        log.info(f"🛒 Lazada local fetch: {url}")

        m2 = re.search(r"https?://(www\.)?(lazada\.[a-z.]+)", url)
        region = m2.group(2) if m2 else "lazada.sg"

        headers = {
            "User-Agent": DEFAULT_UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": f"https://{region}/",
        }

        try:
            async with httpx.AsyncClient(
                timeout=self.timeout,
                proxy=self.proxy,
                follow_redirects=True,
                headers=headers,
            ) as client:
                resp = await client.get(url)
        except Exception as e:
            return self._error_result(url, f"http error: {type(e).__name__}: {e}")

        if resp.status_code != 200:
            return self._error_result(url, f"http {resp.status_code}")

        return self._parse_lazada_html(resp.text, url)

    async def health_check(self) -> bool:
        return True

    def _parse_lazada_html(self, html: str, url: str) -> ProductResult:
        """
        Lazada HTML 解析。

        Lazada 的数据在 window.__STORE__ 或 window.__INITIAL_STATE__ 里
        """
        result = ProductResult(
            url=url,
            source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            fetch_method="http+regex",
            confidence=0.75,
        )

        # 尝试提取 script 中的数据
        for pattern in [
            r"window\.__INITIAL_STATE__\s*=\s*(\{.+?\});</script>",
            r"window\.__STORE__\s*=\s*(\{.+?\});",
            r"<script[^>]*>window\.__NEXT_DATA__\s*=\s*(\{.+?\})</script>",
        ]:
            m = re.search(pattern, html, re.DOTALL)
            if m:
                try:
                    data = json.loads(m.group(1))
                    self._extract_from_json(data, result, url)
                    if result.title and result.price:
                        return result
                except json.JSONDecodeError:
                    continue

        # 降级到 og: meta
        return self._parse_og_fallback(html, url, result)

    def _extract_from_json(self, data, result: ProductResult, url: str) -> None:
        """从 JSON 里抽字段"""
        # Lazada 结构变种多，深度搜索
        pdp = self._find_pdp(data)
        if not pdp:
            return

        result.title = pdp.get("name") or pdp.get("title") or pdp.get("productTitle")

        # 价格（可能含范围）
        price = pdp.get("price") or pdp.get("originalPrice") or pdp.get("salePrice")
        if isinstance(price, dict):
            price = price.get("value") or price.get("text")
        if price is not None:
            try:
                result.price = self._parse_price(str(price))
            except (TypeError, ValueError):
                pass

        # 货币
        if pdp.get("currency"):
            result.currency = str(pdp["currency"])

        # 库存
        stock = pdp.get("stock") or pdp.get("quantity")
        if stock is not None:
            try:
                stock_int = int(stock)
                result.stock = StockStatus.IN_STOCK if stock_int > 0 else StockStatus.OUT_OF_STOCK
            except (TypeError, ValueError):
                pass

        # 卖家
        seller = pdp.get("sellerName") or pdp.get("shopName") or pdp.get("seller")
        if seller:
            result.seller = str(seller)

        # 评分
        rating = pdp.get("rating") or pdp.get("averageRating")
        if rating is not None:
            try:
                result.rating = float(rating)
            except (TypeError, ValueError):
                pass

        # 评论数
        review_count = pdp.get("reviewCount") or pdp.get("totalReviews") or pdp.get("ratings")
        if review_count is not None:
            try:
                result.review_count = int(review_count)
            except (TypeError, ValueError):
                pass

        # 描述
        desc = pdp.get("description") or pdp.get("productDescription")
        if isinstance(desc, str):
            result.description = desc[:2000]

        # 图片
        images = pdp.get("images") or pdp.get("imageUrls") or pdp.get("galleryImages")
        if isinstance(images, list):
            result.images = [str(i.get("url") if isinstance(i, dict) else i) for i in images if i][:5]

    def _find_pdp(self, obj):
        """找到 PDP 数据节点"""
        if not isinstance(obj, dict):
            return None
        # 启发式：找含 name + price 的节点
        if "name" in obj and ("price" in obj or "originalPrice" in obj):
            return obj
        for v in obj.values():
            if isinstance(v, dict):
                r = self._find_pdp(v)
                if r:
                    return r
            elif isinstance(v, list):
                for item in v:
                    r = self._find_pdp(item)
                    if r:
                        return r
        return None

    def _parse_og_fallback(self, html: str, url: str, result: ProductResult) -> ProductResult:
        """og: meta 标签降级"""
        def meta(name):
            m = re.search(rf'<meta property="{name}" content="([^"]+)"', html)
            return m.group(1) if m else None

        result.title = meta("og:title")
        price_str = meta("product:price:amount")
        if price_str:
            try:
                result.price = float(price_str)
            except ValueError:
                pass
        result.currency = meta("product:price:currency")
        result.description = meta("og:description")
        image = meta("og:image")
        if image:
            result.images = [image]

        if not result.title and not result.price:
            return self._error_result(url, "lazada page parsed but no product data found")

        result.confidence = 0.55
        return result

    @staticmethod
    def _parse_price(s: str) -> Optional[float]:
        if not s:
            return None
        cleaned = re.sub(r"[^\d,.\-]", "", s)
        if "," in cleaned and "." in cleaned:
            if cleaned.rfind(",") > cleaned.rfind("."):
                cleaned = cleaned.replace(".", "").replace(",", ".")
            else:
                cleaned = cleaned.replace(",", "")
        elif "," in cleaned:
            cleaned = cleaned.replace(",", ".")
        try:
            return float(cleaned)
        except ValueError:
            return None

    def _error_result(self, url: str, msg: str) -> ProductResult:
        return ProductResult(
            url=url, source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            error=msg,
            fetch_method=self.name,
            confidence=0.0,
        )
