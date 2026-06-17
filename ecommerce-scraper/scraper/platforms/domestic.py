"""
中国电商本地 fetcher —— 抓竞品用。

⚠️ 警告：
- 淘宝/京东/拼多多反爬极强（阿里/京东/字节风控系统）
- ToS 严禁系统化抓取
- 封号/IP/设备指纹不可逆
- 反不正当竞争法可被起诉
- 仅供学习研究 / 受权合规审计用途

生产推荐：**自己店铺用 merchant_api.py 的官方 API**。
抓竞品请先咨询律师。
"""

from datetime import datetime

from scraper.fetcher import Fetcher
from scraper.logging import log
from scraper.platforms import Platform
from scraper.result import ProductResult, Source


class TaobaoLocalFetcher(Fetcher):
    """
    淘宝竞品抓取 fetcher（仅做警告占位）。

    不实现具体抓取逻辑 —— 原因：
    1. 反爬极强（风控 + 设备指纹 + 行为分析三层）
    2. 法律风险高（反不正当竞争法可被起诉）
    3. 自己店铺请用 TaobaoMerchantFetcher
    """
    name = "taobao-local"
    source = Source.LOCAL

    async def fetch(self, url: str, **kwargs) -> ProductResult:
        log.warning(f"⚠️  淘宝抓竞品风险高。自己的店铺请用 TaobaoMerchantFetcher")
        return ProductResult(
            url=url, source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            error=(
                "Taobao 竞品抓取风险极高，未实现本地 fetcher。\n"
                "建议：\n"
                "  1. 自己店铺 → 用 TaobaoMerchantFetcher (官方 API)\n"
                "  2. 抓竞品 → 委托 Apify 第三方服务\n"
                "  3. 必须抓 → 实现 nodriver + 住宅代理 + 真实行为模拟"
            ),
            fetch_method=self.name,
        )

    async def health_check(self) -> bool:
        return False


class JDLocalFetcher(Fetcher):
    """京东竞品 fetcher（仅做警告占位）"""
    name = "jd-local"
    source = Source.LOCAL

    async def fetch(self, url: str, **kwargs) -> ProductResult:
        log.warning(f"⚠️  京东抓竞品风险高")
        return ProductResult(
            url=url, source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            error=(
                "JD 竞品抓取风险极高，未实现本地 fetcher。\n"
                "建议：\n"
                "  1. 自己店铺 → 用 JDMerchantFetcher (京东开放平台)\n"
                "  2. 抓竞品 → 委托 Apify 第三方服务"
            ),
            fetch_method=self.name,
        )

    async def health_check(self) -> bool:
        return False


class PinduoduoLocalFetcher(Fetcher):
    """拼多多竞品 fetcher（仅做警告占位）"""
    name = "pinduoduo-local"
    source = Source.LOCAL

    async def fetch(self, url: str, **kwargs) -> ProductResult:
        log.warning(f"⚠️  拼多多抓竞品风险高")
        return ProductResult(
            url=url, source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            error=(
                "Pinduoduo 竞品抓取风险极高，未实现本地 fetcher。\n"
                "建议：\n"
                "  1. 自己店铺 → 用 PinduoduoMerchantFetcher\n"
                "  2. 抓竞品 → 委托 Apify"
            ),
            fetch_method=self.name,
        )

    async def health_check(self) -> bool:
        return False


class DouyinShopLocalFetcher(Fetcher):
    """抖店竞品 fetcher（仅做警告占位）"""
    name = "douyin-shop-local"
    source = Source.LOCAL

    async def fetch(self, url: str, **kwargs) -> ProductResult:
        log.warning(f"⚠️  抖店抓竞品风险高")
        return ProductResult(
            url=url, source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            error=(
                "Douyin 竞品抓取风险高，未实现本地 fetcher。\n"
                "建议：\n"
                "  1. 自己店铺 → 用 DouyinShopMerchantFetcher\n"
                "  2. 抓竞品 → 委托 Apify"
            ),
            fetch_method=self.name,
        )

    async def health_check(self) -> bool:
        return False


class WeipinhuiLocalFetcher(Fetcher):
    """唯品会竞品 fetcher（占位）"""
    name = "weipinhui-local"
    source = Source.LOCAL

    async def fetch(self, url: str, **kwargs) -> ProductResult:
        return ProductResult(
            url=url, source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            error="Weipinhui 本地 fetcher 未实现，建议用 Apify",
            fetch_method=self.name,
        )

    async def health_check(self) -> bool:
        return False


class SuningLocalFetcher(Fetcher):
    """苏宁竞品 fetcher（占位）"""
    name = "suning-local"
    source = Source.LOCAL

    async def fetch(self, url: str, **kwargs) -> ProductResult:
        return ProductResult(
            url=url, source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            error="Suning 本地 fetcher 未实现，建议用 Apify",
            fetch_method=self.name,
        )

    async def health_check(self) -> bool:
        return False


class Aliyun1688LocalFetcher(Fetcher):
    """1688 竞品 fetcher（占位）"""
    name = "1688-local"
    source = Source.LOCAL

    async def fetch(self, url: str, **kwargs) -> ProductResult:
        return ProductResult(
            url=url, source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            error=(
                "1688 竞品抓取风险高，未实现本地 fetcher。\n"
                "建议：自己店铺 → 用 Aliyun1688MerchantFetcher"
            ),
            fetch_method=self.name,
        )

    async def health_check(self) -> bool:
        return False
