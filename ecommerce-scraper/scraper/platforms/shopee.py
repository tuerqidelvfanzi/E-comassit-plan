"""
Shopee 本地 fetcher —— 完整实现。

Shopee 反爬特点：
- 公开商品页 SSR，能用 HTTP 直接抓
- 但图片懒加载需要触发
- 价格 / 库存通过 window.__INITIAL_STATE__ 注入
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


# Shopee 接受桌面 Chrome UA
DEFAULT_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)


class ShopeeLocalFetcher(Fetcher):
    """
    Shopee 本地 fetcher。

    URL 模式：https://shopee.sg/Product-Name-i.{shop_id}.{item_id}
    """

    name = "shopee-local"
    source = Source.LOCAL

    def __init__(self, *, proxy: Optional[str] = None, timeout: float = 30.0):
        self.proxy = proxy
        self.timeout = timeout

    async def fetch(self, url: str, **kwargs) -> ProductResult:
        log.info(f"🛒 Shopee local fetch: {url}")

        # 提取 shop_id / item_id
        m = re.search(r"-i\.(\d+)\.(\d+)", url)
        if not m:
            return self._error_result(url, "cannot parse shopee URL (need -i.SHOP.ITEM)")
        shop_id, item_id = m.group(1), m.group(2)

        # 识别区域
        m2 = re.search(r"https?://(shopee\.[a-z.]+)", url)
        region = m2.group(1) if m2 else "shopee.sg"

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

        return self._parse_shopee_html(resp.text, url, shop_id, item_id)

    async def health_check(self) -> bool:
        return True

    def _parse_shopee_html(self, html: str, url: str, shop_id: str, item_id: str) -> ProductResult:
        """
        Shopee HTML 解析 —— 关键：提取 window.__INITIAL_STATE__

        Shopee 把商品数据序列化在 <script> 标签里：
        window.__INITIAL_STATE__ = {...}
        """
        result = ProductResult(
            url=url,
            source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            fetch_method="http+regex",
            confidence=0.8,
        )

        # 提取 __INITIAL_STATE__
        m = re.search(r"window\.__INITIAL_STATE__\s*=\s*(\{.+?\});", html, re.DOTALL)
        if not m:
            # 降级：尝试从 og: meta 抓
            return self._parse_og_fallback(html, url, result)

        try:
            data = json.loads(m.group(1))
        except json.JSONDecodeError as e:
            return self._error_result(url, f"JSON decode error: {e}")

        # Shopee 状态结构：data.item.itemDetail.item.item
        # 路径在变 —— 用最稳定的搜索方式
        item = self._deep_find(data, "item") or {}
        # 如果有 item.itemList，遍历
        if isinstance(item, dict) and "itemList" in item:
            items = item["itemList"]
            if items:
                item = items[0] if isinstance(items, list) else next(iter(items.values()), {})

        # 提取字段
        result.title = self._pick_field(item, ["name", "title", "productName"])
        result.description = self._pick_field(item, ["description"])

        # 价格（除以 100000 才是实际价格）
        price_raw = self._pick_field(item, ["price", "priceMin", "priceBeforeDiscount"])
        if price_raw is not None:
            try:
                result.price = float(price_raw) / 100000.0
            except (TypeError, ValueError):
                pass

        # 货币（Shopee 多币种，本地站显示当地币）
        currency = self._pick_field(item, ["currency", "currencySymbol"])
        if currency:
            result.currency = str(currency)

        # 库存
        stock_raw = self._pick_field(item, ["stock", "totalStock", "quantity"])
        if stock_raw is not None:
            try:
                stock_int = int(stock_raw)
                result.stock = (
                    StockStatus.IN_STOCK if stock_int > 0
                    else StockStatus.OUT_OF_STOCK
                )
            except (TypeError, ValueError):
                pass

        # 卖家
        shop_info = self._deep_find(data, "shop") or {}
        if isinstance(shop_info, dict):
            result.seller = (
                shop_info.get("name")
                or shop_info.get("shopName")
                or shop_info.get("accountName")
            )

        # 评分
        rating = self._pick_field(item, ["ratingStar", "itemRating", "rating", "averageRating"])
        if rating is not None:
            try:
                result.rating = float(rating)
            except (TypeError, ValueError):
                pass

        # 评论数
        review_count = self._pick_field(item, ["reviewCount", "totalReviews", "cmtCount"])
        if review_count is not None:
            try:
                result.review_count = int(review_count)
            except (TypeError, ValueError):
                pass

        # 图片
        images = self._pick_field(item, ["images", "image", "imageUrls"])
        if isinstance(images, list):
            result.images = [str(i) for i in images if i][:5]
        elif isinstance(images, str):
            result.images = [images]

        if not result.title and not result.price:
            return self._parse_og_fallback(html, url, result)

        return result

    def _parse_og_fallback(self, html: str, url: str, result: ProductResult) -> ProductResult:
        """og: meta 标签降级解析"""
        title_m = re.search(r'<meta property="og:title" content="([^"]+)"', html)
        price_m = re.search(r'<meta property="product:price:amount" content="([^"]+)"', html)
        currency_m = re.search(r'<meta property="product:price:currency" content="([^"]+)"', html)
        desc_m = re.search(r'<meta property="og:description" content="([^"]+)"', html)
        image_m = re.search(r'<meta property="og:image" content="([^"]+)"', html)

        if title_m:
            result.title = title_m.group(1)
        if price_m:
            try:
                result.price = float(price_m.group(1))
            except ValueError:
                pass
        if currency_m:
            result.currency = currency_m.group(1)
        if desc_m:
            result.description = desc_m.group(1)
        if image_m:
            result.images = [image_m.group(1)]

        if not result.title and not result.price:
            return self._error_result(url, "shopee page parsed but no product data found")

        result.confidence = 0.6  # 降级
        return result

    @staticmethod
    def _deep_find(obj: dict, key: str) -> Optional[dict]:
        """深度查找第一个匹配的 key"""
        if not isinstance(obj, dict):
            return None
        if key in obj:
            return obj[key]
        for v in obj.values():
            if isinstance(v, dict):
                r = ShopeeLocalFetcher._deep_find(v, key)
                if r:
                    return r
            elif isinstance(v, list):
                for item in v:
                    r = ShopeeLocalFetcher._deep_find(item, key)
                    if r:
                        return r
        return None

    @staticmethod
    def _pick_field(obj: dict, keys: list[str]):
        """按候选 key 顺序取值"""
        for k in keys:
            if k in obj and obj[k] is not None:
                return obj[k]
        return None

    def _error_result(self, url: str, msg: str) -> ProductResult:
        return ProductResult(
            url=url,
            source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            error=msg,
            fetch_method=self.name,
            confidence=0.0,
        )
