"""
Apify 客户端封装 —— 调用云端 Actor，标准化返回。
"""

from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Any, Optional

from apify_client import ApifyClient

from scraper.config import settings
from scraper.fetcher import Fetcher
from scraper.logging import log
from scraper.platforms import Platform
from scraper.result import ProductResult, Source, StockStatus


# Apify Actor 输出字段 → ProductResult 字段的映射
# 不同 Actor 输出格式不同，这里给常见模式做一个标准化层
ACTOR_FIELD_MAPPING = {
    Platform.AMAZON: {
        "title": ["title", "productTitle", "name"],
        "price": ["price", "currentPrice", "priceString"],
        "currency": ["currency"],
        "stock": ["availability", "inStock", "stockStatus"],
        "description": ["description", "productDescription", "about"],
        "images": ["images", "imageUrls", "thumbnails"],
        "seller": ["seller", "sellerName", "brand"],
        "rating": ["rating", "stars", "averageRating"],
        "review_count": ["reviewCount", "reviews", "totalReviews"],
        "specs": ["features", "specifications", "attributes"],
    },
    Platform.SHOPEE: {
        "title": ["name", "title", "productName"],
        "price": ["price", "priceMax", "priceMin"],
        "currency": ["currency"],
        "stock": ["stock", "availability"],
        "description": ["description"],
        "images": ["images", "image"],
        "seller": ["shopName", "seller", "shop"],
        "rating": ["rating", "ratingStar"],
        "review_count": ["reviewCount", "sales"],
    },
    Platform.LAZADA: {
        "title": ["name", "title"],
        "price": ["price", "specialPrice"],
        "currency": ["currency"],
        "stock": ["stockStatus"],
        "description": ["description"],
        "images": ["images"],
        "seller": ["sellerName", "shopName"],
        "rating": ["rating"],
        "review_count": ["reviewCount"],
    },
    Platform.TIKTOK_SHOP: {
        "title": ["title", "productName"],
        "price": ["price", "currentPrice"],
        "currency": ["currency"],
        "stock": ["stock", "inStock"],
        "description": ["description"],
        "images": ["images"],
        "seller": ["seller", "shopName"],
        "rating": ["rating"],
        "review_count": ["reviewCount", "sales"],
    },
}


class ApifyFetcher(Fetcher):
    """
    Apify 云端 fetcher。

    优势：使用 Apify 的代理池 + 浏览器集群，不暴露本地 IP
    限制：每个 Actor 是独立的，按平台配置
    """

    name = "apify"
    source = Source.APIFY

    def __init__(self, token: str):
        if not token:
            raise ValueError("Apify token is required")
        self._client = ApifyClient(token=token)

    async def fetch(self, url: str, **kwargs) -> ProductResult:
        """抓取单个 URL"""
        platform: Platform = kwargs.get("platform")
        if not platform:
            return self._error_result(url, "platform not provided")

        actor_id = platform.apify_actor
        if not actor_id:
            return self._error_result(url, f"no apify actor for {platform.value}")

        log.info(f"☁️  Apify → {actor_id} | {url}")

        run_input = {
            "startUrls": [{"url": url}],
            "maxItems": 1,
        }
        # 平台特化输入
        if platform == Platform.AMAZON:
            asin = self._extract_asin(url)
            if asin:
                run_input = {
                    "asins": [asin],
                    "maxItems": 1,
                }

        try:
            # 启动 Actor（同步调用包装成 async）
            loop = asyncio.get_event_loop()
            run = await loop.run_in_executor(
                None,
                lambda: self._client.actor(actor_id).call(
                    run_input=run_input,
                    max_total_charge_usd=settings.apify_max_charge_usd,
                    timeout_secs=60,
                ),
            )
        except Exception as e:
            log.error(f"Apify call failed: {e}")
            return self._error_result(url, f"apify call error: {e}")

        # 拿结果
        try:
            dataset_id = run.get("defaultDatasetId")
            if not dataset_id:
                return self._error_result(url, "no dataset in run result")

            items = list(
                self._client.dataset(dataset_id).iterate_items()
            )
            if not items:
                return self._error_result(url, "apify returned empty dataset")

            # 取第一条
            raw = items[0]
            return self._map_to_result(raw, url, platform, run)
        except Exception as e:
            log.error(f"Apify data fetch failed: {e}")
            return self._error_result(url, f"apify data error: {e}")

    async def health_check(self) -> bool:
        """验证 Apify token 是否有效"""
        try:
            loop = asyncio.get_event_loop()
            user = await loop.run_in_executor(
                None, lambda: self._client.user().get()
            )
            return user is not None
        except Exception as e:
            log.warning(f"Apify health check failed: {e}")
            return False

    # =================================================================
    # 字段映射
    # =================================================================

    def _map_to_result(
        self,
        raw: dict,
        url: str,
        platform: Platform,
        run: dict,
    ) -> ProductResult:
        """把 Actor 输出映射到 ProductResult"""
        mapping = ACTOR_FIELD_MAPPING.get(platform, {})
        result = ProductResult(
            url=url,
            source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            raw=raw,
            fetch_method=f"apify:{platform.apify_actor}",
        )

        # 逐字段映射（容错：字段不存在就 None）
        result.title = self._pick(raw, mapping.get("title", []))
        price_val = self._pick(raw, mapping.get("price", []))
        result.price = self._to_float(price_val)
        result.currency = self._pick(raw, mapping.get("currency", []))
        result.description = self._pick(raw, mapping.get("description", []))
        result.seller = self._pick(raw, mapping.get("seller", []))
        rating_val = self._pick(raw, mapping.get("rating", []))
        result.rating = self._to_float(rating_val)
        review_val = self._pick(raw, mapping.get("review_count", []))
        result.review_count = int(review_val) if review_val is not None else None

        # 图片（可能是 list 或 str）
        images = self._pick(raw, mapping.get("images", [])) or []
        if isinstance(images, str):
            result.images = [images]
        elif isinstance(images, list):
            result.images = [str(i) for i in images if i]
        else:
            result.images = []

        # 库存标准化
        stock_raw = self._pick(raw, mapping.get("stock", []))
        result.stock = self._normalize_stock(stock_raw)

        # Specs（key-value 字典）
        specs_raw = self._pick(raw, mapping.get("specs", [])) or {}
        if isinstance(specs_raw, dict):
            result.specs = {str(k): str(v) for k, v in specs_raw.items()}
        elif isinstance(specs_raw, list):
            result.specs = {f"feature_{i}": str(v) for i, v in enumerate(specs_raw)}

        # 置信度（默认 0.95，Apify 通常比自建更准）
        result.confidence = 0.95

        return result

    @staticmethod
    def _pick(d: dict, keys: list[str]) -> Any:
        """从字典里按候选 key 顺序取值"""
        for k in keys:
            if k in d and d[k] is not None and d[k] != "":
                return d[k]
        return None

    @staticmethod
    def _to_float(v: Any) -> Optional[float]:
        if v is None:
            return None
        if isinstance(v, (int, float)):
            return float(v)
        if isinstance(v, str):
            # 去掉 $ ¥ , 等
            cleaned = "".join(c for c in v if c.isdigit() or c in ".-")
            try:
                return float(cleaned) if cleaned else None
            except ValueError:
                return None
        return None

    @staticmethod
    def _normalize_stock(v: Any) -> Optional[StockStatus]:
        if v is None:
            return None
        if isinstance(v, bool):
            return StockStatus.IN_STOCK if v else StockStatus.OUT_OF_STOCK
        s = str(v).lower()
        if any(x in s for x in ["in stock", "instock", "available", "有货", "现货"]):
            return StockStatus.IN_STOCK
        if any(x in s for x in ["out of stock", "outofstock", "unavailable", "无货", "缺货"]):
            return StockStatus.OUT_OF_STOCK
        if any(x in s for x in ["limited", "few left", "紧张"]):
            return StockStatus.LIMITED
        return StockStatus.UNKNOWN

    @staticmethod
    def _extract_asin(url: str) -> Optional[str]:
        """从 Amazon URL 提取 ASIN（10 字符）"""
        import re
        m = re.search(r"/(?:dp|gp/product|product)/([A-Z0-9]{10})", url)
        return m.group(1) if m else None

    def _error_result(self, url: str, msg: str) -> ProductResult:
        return ProductResult(
            url=url,
            source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            error=msg,
            fetch_method=self.name,
        )
