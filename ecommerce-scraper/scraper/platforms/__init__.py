"""
平台支持清单 —— 国际 + 国内。

每个平台支持两条路径：
  - scrape: 抓取竞品公开数据（Amazon/eBay + 国内电商竞品）
  - api:    商家自己店铺数据（国内电商官方开放平台）

合规原则：
  - 自己店铺 → 永远用官方 API（合法、稳定、有 SLA）
  - 抓竞品 → 严格只抓公开商品信息，不碰个人信息/登录后内容
"""

from enum import Enum
from typing import Optional


class Platform(str, Enum):
    """本工具支持的目标平台"""

    # === 国际电商（抓取为主）===
    AMAZON = "amazon"
    SHOPEE = "shopee"
    LAZADA = "lazada"
    TIKTOK_SHOP = "tiktok_shop"

    # === 中国电商（双路径）===
    TAOBAO = "taobao"          # 淘宝 / 天猫
    JD = "jd"                  # 京东
    PINDUODUO = "pinduoduo"    # 拼多多
    DOUYIN_SHOP = "douyin_shop"  # 抖音电商 / 抖店
    WEIPINHUI = "weipinhui"    # 唯品会
    SUNING = "suning"          # 苏宁
    _1688 = "1688"             # 1688 批发

    @property
    def display_name(self) -> str:
        return {
            Platform.AMAZON: "Amazon",
            Platform.SHOPEE: "Shopee",
            Platform.LAZADA: "Lazada",
            Platform.TIKTOK_SHOP: "TikTok Shop",
            Platform.TAOBAO: "淘宝/天猫",
            Platform.JD: "京东",
            Platform.PINDUODUO: "拼多多",
            Platform.DOUYIN_SHOP: "抖店",
            Platform.WEIPINHUI: "唯品会",
            Platform.SUNING: "苏宁",
            Platform._1688: "1688",
        }[self]

    @property
    def domains(self) -> list[str]:
        return {
            Platform.AMAZON: ["amazon.com", "amazon.co.jp", "amazon.co.uk",
                              "amazon.de", "amazon.fr", "amazon.it", "amazon.es",
                              "amazon.ca", "amazon.com.mx", "amazon.com.br",
                              "amazon.com.au", "amazon.in", "amazon.sg"],
            Platform.SHOPEE: ["shopee.sg", "shopee.com.my", "shopee.co.id",
                              "shopee.tw", "shopee.co.th", "shopee.vn",
                              "shopee.ph", "shopee.com.br"],
            Platform.LAZADA: ["lazada.sg", "lazada.co.id", "lazada.com.ph",
                              "lazada.vn", "lazada.com.my", "lazada.co.th"],
            Platform.TIKTOK_SHOP: ["shop.tiktok.com", "seller.tiktok.com",
                                   "seller-th.tiktok.com", "seller-id.tiktok.com"],
            Platform.TAOBAO: ["taobao.com", "tmall.com", "tmall.hk",
                              "world.taobao.com", "item.taobao.com",
                              "detail.tmall.com", "detail.tmall.hk"],
            Platform.JD: ["jd.com", "item.jd.com", "yhd.com"],
            Platform.PINDUODUO: ["pinduoduo.com", "pdd.cn", "mobile.yangkeduo.com",
                                  "yangkeduo.com"],
            Platform.DOUYIN_SHOP: ["jinritemai.com", "douyin.com", "shop.douyin.com"],
            Platform.WEIPINHUI: ["vip.com"],
            Platform.SUNING: ["suning.com"],
            Platform._1688: ["1688.com", "detail.1688.com", "s.1688.com"],
        }[self]

    @property
    def apify_actor(self) -> Optional[str]:
        """对应的 Apify Actor ID（国际平台都有，国内平台 Apify 上无成熟 scraper）"""
        return {
            Platform.AMAZON: "apify/amazon-product-scraper",
            Platform.SHOPEE: "apify/shopee-scraper",
            Platform.LAZADA: "apify/lazada-scraper",
            Platform.TIKTOK_SHOP: "apify/tiktok-shop-scraper",
            # 国内平台 Apify 上无成熟 Actor，强制走本地
        }.get(self)

    @property
    def is_chinese(self) -> bool:
        return self in {
            Platform.TAOBAO, Platform.JD, Platform.PINDUODUO,
            Platform.DOUYIN_SHOP, Platform.WEIPINHUI,
            Platform.SUNING, Platform._1688,
        }

    @property
    def official_api_name(self) -> Optional[str]:
        """对应的官方开放平台名称（用于自己店铺）"""
        return {
            Platform.TAOBAO: "淘宝开放平台 (open.taobao.com) / 天猫商家后台",
            Platform.JD: "京东联盟 / 京东商家后台 (open.jd.com)",
            Platform.PINDUODUO: "多多进宝 / 拼多多商家后台",
            Platform.DOUYIN_SHOP: "抖店开放平台 (op.jinritemai.com)",
            Platform.WEIPINHUI: "唯品会开放平台",
            Platform.SUNING: "苏宁开放平台",
            Platform._1688: "1688 开放平台 (open.1688.com)",
        }.get(self)

    @property
    def risk_warning(self) -> str:
        """对该平台抓取竞品的法律风险提示"""
        if not self.is_chinese:
            return ""
        return (
            f"⚠️  {self.display_name} 抓取竞品数据风险高：\n"
            f"   - 《反不正当竞争法》限制系统性抓对手数据\n"
            f"   - ToS 严格禁止，账号/IP 一旦封禁不可恢复\n"
            f"   - 自己店铺请用 {self.official_api_name}\n"
            f"   - 抓竞品请确认：仅公开商品信息、不绕登录、不传个人信息、用途合法"
        )


def detect_platform(url: str) -> Optional[Platform]:
    """
    从 URL 识别平台。

    Returns:
        Platform: 匹配时返回对应平台
        None: URL 不在白名单内
    """
    from urllib.parse import urlparse

    parsed = urlparse(url.lower())
    host = parsed.netloc.replace("www.", "")

    for platform in Platform:
        for domain in platform.domains:
            if host == domain or host.endswith(f".{domain}"):
                return platform

    return None
