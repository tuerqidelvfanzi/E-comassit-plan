"""
TikTok Shop 本地 fetcher —— 完整实现。

TikTok Shop 反爬特点：
- ByteDance 系，TikTok 同源指纹
- 移动端 API 较开放（用 XHR）
- 公开商品页含 window.__INITIAL_STATE__
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


class TikTokShopLocalFetcher(Fetcher):
    """TikTok Shop 本地 fetcher"""

    name = "tiktok-shop-local"
    source = Source.LOCAL

    def __init__(self, *, proxy: Optional[str] = None, timeout: float = 30.0):
        self.proxy = proxy
        self.timeout = timeout

    async def fetch(self, url: str, **kwargs) -> ProductResult:
        log.info(f"🛒 TikTok Shop local fetch: {url}")

        headers = {
            "User-Agent": DEFAULT_UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://shop.tiktok.com/",
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

        return self._parse_html(resp.text, url)

    async def health_check(self) -> bool:
        return True

    def _parse_html(self, html: str, url: str) -> ProductResult:
        result = ProductResult(
            url=url,
            source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            fetch_method="http+regex",
            confidence=0.7,
        )

        # 提取 JSON 数据
        for pattern in [
            r"<script[^>]*>window\.__INITIAL_STATE__\s*=\s*(\{.+?\})</script>",
            r"<script[^>]*>window\.__NEXT_DATA__\s*=\s*(\{.+?\})</script>",
            r"window\._ROUTER_DATA\s*=\s*(\{.+?\});</script>",
        ]:
            m = re.search(pattern, html, re.DOTALL)
            if m:
                try:
                    data = json.loads(m.group(1))
                    self._extract(data, result, url)
                    if result.title and result.price:
                        return result
                except json.JSONDecodeError:
                    continue

        return self._parse_og_fallback(html, url, result)

    def _extract(self, data, result: ProductResult, url: str) -> None:
        # TikTok Shop 数据结构不稳定，深度搜索
        for d in self._walk_dicts(data):
            if "product_name" in d or "title" in d:
                result.title = result.title or d.get("product_name") or d.get("title")
            if "price" in d and isinstance(d["price"], (int, float, str)):
                try:
                    p = d["price"]
                    if isinstance(p, str):
                        p = float(re.sub(r"[^\d.]", "", p))
                    if result.price is None:
                        result.price = float(p)
                except (TypeError, ValueError):
                    pass
            if "currency" in d and not result.currency:
                result.currency = str(d["currency"])
            if "seller_name" in d or "shop_name" in d:
                result.seller = result.seller or d.get("seller_name") or d.get("shop_name")
            if "rating" in d and result.rating is None:
                try:
                    result.rating = float(d["rating"])
                except (TypeError, ValueError):
                    pass
            if "review_count" in d and result.review_count is None:
                try:
                    result.review_count = int(d["review_count"])
                except (TypeError, ValueError):
                    pass
            if "stock" in d and result.stock is None:
                try:
                    s = int(d["stock"])
                    result.stock = StockStatus.IN_STOCK if s > 0 else StockStatus.OUT_OF_STOCK
                except (TypeError, ValueError):
                    pass
            if "images" in d and not result.images:
                imgs = d["images"]
                if isinstance(imgs, list):
                    result.images = [str(i) for i in imgs if i][:5]
            if result.title and result.price is not None:
                break

    def _walk_dicts(self, obj):
        """遍历所有嵌套字典（深度优先）"""
        if isinstance(obj, dict):
            yield obj
            for v in obj.values():
                yield from self._walk_dicts(v)
        elif isinstance(obj, list):
            for item in obj:
                yield from self._walk_dicts(item)

    def _parse_og_fallback(self, html: str, url: str, result: ProductResult) -> ProductResult:
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

        if not result.title:
            return self._error_result(url, "tiktok shop page parsed but no product data found")

        result.confidence = 0.5
        return result

    def _error_result(self, url: str, msg: str) -> ProductResult:
        return ProductResult(
            url=url, source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            error=msg,
            fetch_method=self.name,
            confidence=0.0,
        )
