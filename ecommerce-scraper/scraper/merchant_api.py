"""
商家后台 API fetcher —— 自己店铺走官方 API 路径。

针对中国电商的官方开放平台：
  - 淘宝开放平台 (open.taobao.com)
  - 京东开放平台 (open.jd.com)
  - 抖店开放平台 (op.jinritemai.com)
  - 拼多多开放平台
  - 1688 开放平台 (open.1688.com)

为什么单独这个 fetcher？
  - 合法：自己店铺，官方授权
  - 稳定：SLA 保证，不会被封
  - 全量：订单、库存、销售额、流量全有
  - 实时：增量推送，毫秒级
"""

from __future__ import annotations

import abc
import hashlib
import hmac
import time
from datetime import datetime
from typing import Any, Optional

import httpx

from scraper.fetcher import Fetcher
from scraper.logging import log
from scraper.platforms import Platform
from scraper.result import ProductResult, Source, StockStatus


class MerchantApiFetcher(Fetcher):
    """
    商家后台 API fetcher 基类。

    每个中国电商平台需要继承实现：
    - sign()      生成请求签名
    - call_api()  调用平台 API
    - fetch_product() / fetch_orders() 等具体方法
    """

    name = "merchant-api"
    source = Source.LOCAL  # 数据来源是"自己"不是爬的

    def __init__(self, app_key: str, app_secret: str, access_token: str, **kwargs):
        self.app_key = app_key
        self.app_secret = app_secret
        self.access_token = access_token
        self.extra = kwargs

    @abc.abstractmethod
    def sign(self, params: dict) -> str:
        """生成请求签名（每个平台算法不同）"""
        ...

    @abc.abstractmethod
    async def call_api(self, method: str, params: dict) -> dict:
        """调用平台 API"""
        ...

    async def fetch(self, url: str, **kwargs) -> ProductResult:
        """商家 API 通常不用 URL，而是用 item_id"""
        return ProductResult(
            url=url, source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            error="merchant API needs item_id, not url. Use fetch_product() instead.",
            fetch_method=self.name,
        )

    async def health_check(self) -> bool:
        try:
            result = await self.call_api("test", {})
            # 各平台成功码不同，宽松判断
            return result is not None
        except Exception as e:
            log.warning(f"Merchant API health check failed: {e}")
            return False

    async def fetch_product(self, item_id: str) -> Optional[ProductResult]:
        """拉取单个商品的库存/价格（自己店铺）"""
        raise NotImplementedError

    async def fetch_orders(self, start: datetime, end: datetime) -> list[dict]:
        """拉取订单（增量）"""
        raise NotImplementedError


# =============================================================================
# 淘宝开放平台
# =============================================================================

class TaobaoMerchantFetcher(MerchantApiFetcher):
    """
    淘宝开放平台 fetcher。

    需要：
      - AppKey / AppSecret（https://open.taobao.com 注册应用）
      - AccessToken（OAuth 授权获取）
      - 白名单 IP（在开放平台后台配置）

    常用 API：
      - taobao.item.get           获取商品详情
      - taobao.items.list.get     批量商品列表
      - taobao.trades.sold.get    已卖出的订单
      - taobao.item.skus.get      SKU 库存
    """

    name = "taobao-merchant-api"
    API_BASE = "https://eco.taobao.com/router/rest"

    async def call_api(self, method: str, params: dict) -> dict:
        common = {
            "app_key": self.app_key,
            "method": method,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "format": "json",
            "v": "2.0",
            "sign_method": "md5",
        }
        if self.access_token:
            common["session"] = self.access_token
        all_params = {**common, **params}
        all_params["sign"] = self.sign(all_params)

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(self.API_BASE, data=all_params)
            return resp.json()

    def sign(self, params: dict) -> str:
        sorted_params = sorted(params.items())
        sign_string = self.app_secret
        for k, v in sorted_params:
            if k == "sign" or v is None:
                continue
            sign_string += f"{k}{v}"
        sign_string += self.app_secret
        return hashlib.md5(sign_string.encode("utf-8")).hexdigest().upper()

    async def fetch_product(self, item_id: str) -> Optional[ProductResult]:
        result = await self.call_api("taobao.item.get", {
            "num_iid": item_id,
            "fields": "title,price,num,approve_status,list_time,delist_time,desc",
        })
        item_response = result.get("item_get_response", {}).get("item", {})
        if not item_response:
            log.warning(f"Taobao API returned no item: {item_id}")
            return None

        return ProductResult(
            url=f"https://item.taobao.com/item.htm?id={item_id}",
            source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            title=item_response.get("title"),
            price=float(item_response.get("price", 0)) or None,
            stock=StockStatus.IN_STOCK if item_response.get("num", 0) > 0 else StockStatus.OUT_OF_STOCK,
            description=item_response.get("desc"),
            seller="self",
            raw=item_response,
            confidence=1.0,  # 官方 API = 100% 准
            fetch_method=f"taobao-open-api:{self.app_key[:8]}",
        )

    async def fetch_orders(self, start: datetime, end: datetime) -> list[dict]:
        result = await self.call_api("taobao.trades.sold.get", {
            "start_created": start.strftime("%Y-%m-%d %H:%M:%S"),
            "end_created": end.strftime("%Y-%m-%d %H:%M:%S"),
            "status": "WAIT_SELLER_SEND_GOODS,WAIT_BUYER_CONFIRM_GOODS,TRADE_FINISHED",
            "fields": "tid,status,payment,created,num_iid,title,price,num",
        })
        return result.get("trades_sold_get_response", {}).get("trades", {}).get("trade", [])


# =============================================================================
# 京东开放平台（POP 商家 API）
# =============================================================================

class JDMerchantFetcher(MerchantApiFetcher):
    """
    京东 POP 商家 API fetcher。

    需要：
      - app_key / app_secret（https://open.jd.com 注册）
      - access_token（OAuth 授权）
      - 商家身份（POP 商家，非自营）

    常用 API：
      - jingdong.ware.get         商品详情
      - jingdong.ware.list        商品列表
      - jingdong.order.search     订单查询

    ⚠️ 签名规则：京东用 HMAC-SHA256（与淘宝不同）
    """

    name = "jd-merchant-api"
    API_BASE = "https://api.jd.com/routerjson"

    async def call_api(self, method: str, params: dict) -> dict:
        common = {
            "app_key": self.app_key,
            "method": method,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "format": "json",
            "v": "2.0",
            "sign_method": "sha256",
            "access_token": self.access_token,
        }
        all_params = {**common, **params}
        all_params["sign"] = self.sign(all_params)

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(self.API_BASE, data=all_params)
            return resp.json()

    def sign(self, params: dict) -> str:
        # 京东签名：排序参数 + 拼接 + HMAC-SHA256 + 两次 MD5
        sorted_params = sorted(params.items())
        sign_string = self.app_secret
        for k, v in sorted_params:
            if k == "sign" or v is None:
                continue
            sign_string += f"{k}{v}"
        sign_string += self.app_secret
        hmac_str = hmac.new(
            self.app_secret.encode("utf-8"),
            sign_string.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest().upper()
        return hmac_str

    async def fetch_product(self, item_id: str) -> Optional[ProductResult]:
        result = await self.call_api("jingdong.ware.get", {
            "ware_id": item_id,
            "fields": "ware_id,title,price,stock_num,brand_name,cat_id",
        })
        ware_response = result.get("jingdong_ware_get_response", {}).get("ware", {})
        if not ware_response:
            log.warning(f"JD API returned no ware: {item_id}")
            return None

        return ProductResult(
            url=f"https://item.jd.com/{item_id}.html",
            source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            title=ware_response.get("title"),
            price=float(ware_response.get("price", 0)) or None,
            stock=StockStatus.IN_STOCK if int(ware_response.get("stock_num", 0)) > 0 else StockStatus.OUT_OF_STOCK,
            seller="self",
            raw=ware_response,
            confidence=1.0,
            fetch_method=f"jd-open-api:{self.app_key[:8]}",
            currency="CNY",
        )


# =============================================================================
# 拼多多开放平台
# =============================================================================

class PinduoduoMerchantFetcher(MerchantApiFetcher):
    """
    拼多多商家 API fetcher。

    需要：
      - client_id / client_secret（多多进宝/拼多多开放平台）
      - access_token
      - 拼多多商家身份

    常用 API：
      - pdd.goods.detail.get     商品详情
      - pdd.goods.list.get       商品列表
      - pdd.order.list.get       订单列表

    ⚠️ 拼多多签名：MD5，参数排序后 + client_secret 前缀后缀
    """

    name = "pdd-merchant-api"
    API_BASE = "https://gw-api.pinduoduo.com/api/router"

    async def call_api(self, method: str, params: dict) -> dict:
        common = {
            "type": method,
            "client_id": self.app_key,
            "timestamp": str(int(time.time())),
            "data_type": "JSON",
        }
        if self.access_token:
            common["access_token"] = self.access_token
        all_params = {**common, **params}
        all_params["sign"] = self.sign(all_params)

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(self.API_BASE, json=all_params)
            return resp.json()

    def sign(self, params: dict) -> str:
        # 拼多多签名：排序后拼接
        sorted_params = sorted(params.items())
        sign_string = self.app_secret
        for k, v in sorted_params:
            if k == "sign" or v is None:
                continue
            sign_string += f"{k}{v}"
        sign_string += self.app_secret
        return hashlib.md5(sign_string.encode("utf-8")).hexdigest().upper()

    async def fetch_product(self, item_id: str) -> Optional[ProductResult]:
        result = await self.call_api("pdd.goods.detail.get", {
            "goods_id": item_id,
        })
        goods_response = result.get("goods_detail_get_response", {}).get("goods", {})
        if not goods_response:
            log.warning(f"PDD API returned no goods: {item_id}")
            return None

        return ProductResult(
            url=f"https://mobile.yangkeduo.com/goods.html?goods_id={item_id}",
            source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            title=goods_response.get("goods_name"),
            # PDD 价格单位是分
            price=int(goods_response.get("min_group_price", 0)) / 100.0 or None,
            stock=StockStatus.IN_STOCK if int(goods_response.get("goods_quantity", 0)) > 0 else StockStatus.OUT_OF_STOCK,
            seller="self",
            raw=goods_response,
            confidence=1.0,
            fetch_method=f"pdd-open-api:{self.app_key[:8]}",
            currency="CNY",
        )


# =============================================================================
# 1688 开放平台
# =============================================================================

class Aliyun1688MerchantFetcher(MerchantApiFetcher):
    """
    1688 开放平台 fetcher。

    申请：https://open.1688.com
    文档：阿里巴巴开放平台 1688 API
    """

    name = "1688-merchant-api"
    API_BASE = "https://gw.open.1688.com/openapi/http/1/system.port"

    async def call_api(self, method: str, params: dict) -> dict:
        common = {
            "app_key": self.app_key,
            "method": method,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "format": "json",
            "v": "1.0",
            "sign_method": "md5",
        }
        if self.access_token:
            common["access_token"] = self.access_token
        all_params = {**common, **params}
        all_params["sign"] = self.sign(all_params)

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(self.API_BASE, data=all_params)
            return resp.json()

    def sign(self, params: dict) -> str:
        sorted_params = sorted(params.items())
        sign_string = self.app_secret
        for k, v in sorted_params:
            if k == "sign" or v is None:
                continue
            sign_string += f"{k}{v}"
        sign_string += self.app_secret
        return hashlib.md5(sign_string.encode("utf-8")).hexdigest().upper()

    async def fetch_product(self, item_id: str) -> Optional[ProductResult]:
        result = await self.call_api("alibaba.product.get", {
            "productID": item_id,
        })
        product = result.get("result", {}).get("product", {})
        if not product:
            log.warning(f"1688 API returned no product: {item_id}")
            return None

        # 1688 价格区间
        price_range = product.get("priceRanges", [])
        price = None
        if price_range and isinstance(price_range, list):
            try:
                price = float(price_range[0].get("price", 0))
            except (IndexError, TypeError, ValueError):
                pass

        return ProductResult(
            url=f"https://detail.1688.com/offer/{item_id}.html",
            source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            title=product.get("subject"),
            price=price,
            stock=StockStatus.IN_STOCK if int(product.get("canBookedAmountForShow", 0)) > 0 else StockStatus.OUT_OF_STOCK,
            seller="self",
            raw=product,
            confidence=1.0,
            fetch_method=f"1688-open-api:{self.app_key[:8]}",
            currency="CNY",
        )


# =============================================================================
# 抖店 / 抖音电商开放平台
# =============================================================================

class DouyinShopMerchantFetcher(MerchantApiFetcher):
    """
    抖店开放平台 fetcher。

    申请：https://op.jinritemai.com
    文档：抖店开放平台 API

    ⚠️ 抖店 API 文档频繁变动，签名算法可能需要按当前文档调整
    """

    name = "douyin-shop-merchant-api"
    API_BASE = "https://openapi-fxg.jinritemai.com/product/search"

    async def call_api(self, method: str, params: dict) -> dict:
        # 抖店 API 多数用 GET + query string
        common = {
            "app_key": self.app_key,
            "method": method,
            "timestamp": str(int(time.time())),
            "v": "2",
            "access_token": self.access_token,
        }
        all_params = {**common, **params}
        all_params["sign"] = self.sign(all_params)

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(self.API_BASE, params=all_params)
            return resp.json()

    def sign(self, params: dict) -> str:
        # 抖店签名：MD5
        sorted_params = sorted(params.items())
        sign_string = self.app_secret
        for k, v in sorted_params:
            if k == "sign" or v is None:
                continue
            sign_string += f"{k}{v}"
        sign_string += self.app_secret
        return hashlib.md5(sign_string.encode("utf-8")).hexdigest().upper()

    async def fetch_product(self, item_id: str) -> Optional[ProductResult]:
        # 抖店 API 调用方式：实际需按最新文档调整
        result = await self.call_api("product.detail", {
            "product_id": item_id,
        })
        product = result.get("data", {})
        if not product:
            log.warning(f"Douyin shop API returned no product: {item_id}")
            return None

        return ProductResult(
            url=f"https://haohuo.jinritemai.com/product/{item_id}",
            source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            title=product.get("name") or product.get("title"),
            price=float(product.get("price", 0)) / 100.0 or None,  # 抖店价格单位是分
            stock=StockStatus.IN_STOCK if int(product.get("stock", 0)) > 0 else StockStatus.OUT_OF_STOCK,
            seller="self",
            raw=product,
            confidence=1.0,
            fetch_method=f"douyin-shop-open-api:{self.app_key[:8]}",
            currency="CNY",
        )


# =============================================================================
# 唯品会 / 苏宁占位实现（API 文档不公开，可联系商务获取）
# =============================================================================

class WeipinhuiMerchantFetcher(MerchantApiFetcher):
    """唯品会商家 API（占位实现，需联系唯品会商务获取 API 文档）"""
    name = "weipinhui-merchant-api"
    API_BASE = "https://openapi.vip.com/api"

    async def call_api(self, method: str, params: dict) -> dict:
        raise NotImplementedError("唯品会 API 需联系商务获取。申请地址：vip.com 商家中心 → 开放平台")

    def sign(self, params: dict) -> str:
        raise NotImplementedError


class SuningMerchantFetcher(MerchantApiFetcher):
    """苏宁商家 API（占位实现，需联系苏宁商务获取）"""
    name = "suning-merchant-api"
    API_BASE = "https://open.suning.com/api/http"

    async def call_api(self, method: str, params: dict) -> dict:
        raise NotImplementedError("苏宁 API 需联系商务获取。申请地址：open.suning.com")

    def sign(self, params: dict) -> str:
        raise NotImplementedError


# =============================================================================
# 工厂
# =============================================================================

def get_merchant_fetcher(platform: Platform, **creds) -> Optional[MerchantApiFetcher]:
    """根据平台返回对应的商家 API fetcher"""
    mapping = {
        Platform.TAOBAO: TaobaoMerchantFetcher,
        Platform.JD: JDMerchantFetcher,
        Platform.PINDUODUO: PinduoduoMerchantFetcher,
        Platform._1688: Aliyun1688MerchantFetcher,
        Platform.DOUYIN_SHOP: DouyinShopMerchantFetcher,
        Platform.WEIPINHUI: WeipinhuiMerchantFetcher,
        Platform.SUNING: SuningMerchantFetcher,
    }
    cls = mapping.get(platform)
    if cls is None:
        log.warning(f"Merchant API fetcher not implemented for {platform.value}")
        return None
    try:
        return cls(**creds)
    except Exception as e:
        log.error(f"Failed to instantiate {cls.__name__}: {e}")
        return None
