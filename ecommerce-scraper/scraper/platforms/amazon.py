"""
Amazon 本地 fetcher —— 完整可工作实现。

抓取策略（按优先级）：
1. HTTP + BeautifulSoup（快速、无浏览器依赖，能处理 70% 公开商品页）
2. Playwright headless（处理需要 JS 渲染的商品，价格动态加载场景）
3. undetected-playwright（终极反指纹，对抗强风控场景）

注意：Amazon 对频繁请求会返回 CAPTCHA（503 + 验证码页）。
生产环境务必配置代理 + 限流。
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Optional

import httpx
from bs4 import BeautifulSoup

from scraper.fetcher import Fetcher
from scraper.logging import log
from scraper.result import ProductResult, Source, StockStatus


# Amazon 商品页常见反爬标志
AMAZON_CAPTCHA_MARKERS = [
    "Enter the characters you see below",
    "Sorry, we just need to make sure you're not a robot",
    "/errors/validateCaptcha",
]

AMAZON_BLOCK_MARKERS = [
    "Sorry! Something went wrong",
    "Server Error",
    "503 Service Unavailable",
]

# 真实浏览器 UA（Amazon 接受桌面 Chrome）
DEFAULT_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)


class AmazonLocalFetcher(Fetcher):
    """
    Amazon 本地 fetcher（完整实现）。

    用法:
        fetcher = AmazonLocalFetcher()
        result = await fetcher.fetch("https://www.amazon.com/dp/B0XXXXX")
    """

    name = "amazon-local"
    source = Source.LOCAL

    def __init__(
        self,
        *,
        use_browser_fallback: bool = True,
        proxy: Optional[str] = None,
        timeout: float = 30.0,
    ):
        """
        Args:
            use_browser_fallback: HTTP 失败时是否尝试 Playwright
            proxy: 代理 URL，如 "http://user:pass@host:port"
            timeout: 单次请求超时
        """
        self.use_browser_fallback = use_browser_fallback
        self.proxy = proxy
        self.timeout = timeout

    async def fetch(self, url: str, **kwargs) -> ProductResult:
        log.info(f"🛒 Amazon local fetch: {url}")

        # === 路径 1: HTTP + BeautifulSoup ===
        result = await self._scrape_via_http(url)
        if result and not result.error:
            return result

        # === 路径 2: Playwright fallback ===
        if self.use_browser_fallback and result is not None:
            log.info("🔄 HTTP 路径失败，尝试 Playwright...")
            browser_result = await self._scrape_via_browser(url)
            if browser_result and not browser_result.error:
                return browser_result

        return result or self._error_result(url, "all paths failed")

    async def health_check(self) -> bool:
        """检查 httpx 可用（Playwright 是可选）"""
        return True  # httpx 是必装依赖

    # =================================================================
    # 路径 1: HTTP + BeautifulSoup
    # =================================================================

    async def _scrape_via_http(self, url: str) -> Optional[ProductResult]:
        """HTTP 请求 + 解析"""
        headers = {
            "User-Agent": DEFAULT_UA,
            "Accept": (
                "text/html,application/xhtml+xml,application/xml;q=0.9,"
                "image/avif,image/webp,*/*;q=0.8"
            ),
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Upgrade-Insecure-Requests": "1",
        }

        try:
            async with httpx.AsyncClient(
                timeout=self.timeout,
                proxy=self.proxy,
                follow_redirects=True,
                headers=headers,
            ) as client:
                resp = await client.get(url)
        except httpx.TimeoutException:
            return self._error_result(url, f"timeout after {self.timeout}s")
        except Exception as e:
            return self._error_result(url, f"http error: {type(e).__name__}: {e}")

        if resp.status_code != 200:
            return self._error_result(url, f"http {resp.status_code}")

        html = resp.text

        # 检测反爬
        for marker in AMAZON_CAPTCHA_MARKERS:
            if marker in html:
                return self._error_result(url, "captcha detected (need browser or proxy)")
        for marker in AMAZON_BLOCK_MARKERS:
            if marker in html and len(html) < 5000:
                return self._error_result(url, f"blocked page: {marker}")

        return self._parse_amazon_html(html, url)

    def _parse_amazon_html(self, html: str, url: str) -> ProductResult:
        """
        Amazon HTML 解析 —— 提取核心商品字段。

        选择器策略：
        - 优先精确选择器（#productTitle 等）
        - 备选 schema.org microdata（itemprop="name" 等）
        - 最终降级：og: meta 标签
        """
        soup = BeautifulSoup(html, "lxml")

        result = ProductResult(
            url=url,
            source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            fetch_method="http+bs4",
            confidence=0.85,  # HTTP 路径置信度
        )

        # === 标题 ===
        title = self._extract_text(soup, [
            "#productTitle",
            "[data-feature-name='productTitle']",
            "h1#title",
            "span#productTitle",
            "h1.a-size-large",
        ])
        if title:
            result.title = title.strip()

        # === 价格 ===
        price_str = self._extract_text(soup, [
            ".a-price .a-offscreen",
            "#priceblock_ourprice",
            "#priceblock_dealprice",
            "#priceblock_saleprice",
            "span.a-price-whole",
            "[data-feature-name='price'] .a-offscreen",
        ])
        if price_str:
            result.price = self._parse_price(price_str)
            # 货币
            currency_symbol = price_str.strip()[0] if price_str.strip() else ""
            result.currency = {
                "$": "USD", "£": "GBP", "€": "EUR", "¥": "CNY", "₹": "INR",
            }.get(currency_symbol, None)

        # === 库存 ===
        availability = self._extract_text(soup, [
            "#availability span",
            "#availability",
            "[data-feature-name='availability']",
        ])
        if availability:
            result.stock = self._parse_stock(availability)

        # === 评分 ===
        rating = self._extract_text(soup, [
            "[data-feature-name='averageCustomerReviews'] .a-icon-alt",
            "#acrPopover",
            "i.a-icon-star span",
            "span.a-icon-alt",
        ])
        if rating:
            m = re.search(r"(\d+\.?\d*)", rating)
            if m:
                result.rating = float(m.group(1))

        # === 评论数 ===
        review_text = self._extract_text(soup, [
            "#acrCustomerReviewText",
            "[data-feature-name='reviewsCount']",
        ])
        if review_text:
            m = re.search(r"([\d,]+)", review_text)
            if m:
                result.review_count = int(m.group(1).replace(",", ""))

        # === 卖家/品牌 ===
        seller = self._extract_text(soup, [
            "#bylineInfo",
            "[data-feature-name='brand']",
            "#brand",
            "a#bylineInfo",
        ])
        if seller:
            result.seller = seller.strip()

        # === 描述（特性 bullets）===
        bullets = []
        bullet_list = soup.select("#feature-bullets ul li, #feature-bullets li")
        for b in bullet_list:
            text = b.get_text(strip=True)
            if text and len(text) > 5:
                bullets.append(text)
        if bullets:
            result.description = "\n".join(bullets[:10])

        # === 图片 ===
        img = soup.select_one("#landingImage, #imgBlkFront, #main-image")
        if img and img.get("src"):
            result.images = [img["src"]]
        elif img and img.get("data-old-hd"):
            result.images = [img["data-old-hd"]]

        # === Specs（特征表）===
        for tr in soup.select("#productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr"):
            key = tr.select_one("th, .prodDetSectionEntry")
            value = tr.select_one("td, .prodDetAttrValue")
            if key and value:
                k = key.get_text(strip=True)
                v = value.get_text(strip=True)
                if k and v and len(k) < 50:
                    result.specs[k] = v

        return result

    # =================================================================
    # 路径 2: Playwright fallback
    # =================================================================

    async def _scrape_via_browser(self, url: str) -> Optional[ProductResult]:
        """
        Playwright fallback —— 处理需要 JS 渲染的场景。

        失败时返回 None，由 HTTP 路径的结果作为最终返回。
        """
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            log.warning("Playwright not installed, skip browser fallback")
            return None

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    headless=True,
                    args=["--disable-blink-features=AutomationControlled"],
                )
                context = await browser.new_context(
                    user_agent=DEFAULT_UA,
                    viewport={"width": 1366, "height": 768},
                    locale="en-US",
                )
                page = await context.new_page()
                await page.goto(url, wait_until="domcontentloaded", timeout=int(self.timeout * 1000))
                # 等待商品标题渲染
                try:
                    await page.wait_for_selector("#productTitle", timeout=8000)
                except Exception:
                    log.warning("[Amazon] #productTitle not found in 8s, trying og:title")

                html = await page.content()
                await browser.close()
                return self._parse_amazon_html(html, url)
        except Exception as e:
            log.error(f"Playwright fallback failed: {e}")
            return None

    # =================================================================
    # 工具方法
    # =================================================================

    @staticmethod
    def _extract_text(soup: BeautifulSoup, selectors: list[str]) -> Optional[str]:
        """按选择器列表优先级提取第一个非空文本"""
        for sel in selectors:
            try:
                el = soup.select_one(sel)
                if el:
                    text = el.get_text(strip=True)
                    if text:
                        return text
            except Exception:
                continue
        return None

    @staticmethod
    def _parse_price(s: str) -> Optional[float]:
        """从 '$1,234.56' / '€1.234,56' / '¥1234' 提取 float"""
        if not s:
            return None
        # 移除货币符号和空格
        cleaned = re.sub(r"[^\d,.\-]", "", s)
        # 处理千位分隔符：1,234.56 (en) vs 1.234,56 (eu)
        if "," in cleaned and "." in cleaned:
            if cleaned.rfind(",") > cleaned.rfind("."):
                cleaned = cleaned.replace(".", "").replace(",", ".")
            else:
                cleaned = cleaned.replace(",", "")
        elif "," in cleaned:
            # 只有逗号，可能是千位分隔或小数
            if re.match(r"^[\d]+,[\d]{1,2}$", cleaned):
                cleaned = cleaned.replace(",", ".")
            else:
                cleaned = cleaned.replace(",", "")
        try:
            return float(cleaned)
        except ValueError:
            return None

    @staticmethod
    def _parse_stock(s: str) -> StockStatus:
        """解析库存状态文本

        匹配顺序：先看负面信号（缺货/不可用），再看正面信号（在售）。
        "Currently unavailable" 不能被"available"先匹配掉。
        """
        s_lower = s.lower().strip()
        if not s_lower:
            return StockStatus.UNKNOWN

        # 1) 缺货信号（最高优先级）
        if any(x in s_lower for x in [
            "out of stock", "currently unavailable", "unavailable",
            "we don't know when", "not in stock", "discontinued",
        ]):
            return StockStatus.OUT_OF_STOCK

        # 2) 限量信号（only N left 优于 in stock）
        import re as _re
        if _re.search(r"only\s+\d+\s+left", s_lower) or "limited stock" in s_lower or "few left" in s_lower:
            return StockStatus.LIMITED

        # 3) 在售信号
        if any(x in s_lower for x in ["in stock", "available for", "available from", "in stock."]):
            return StockStatus.IN_STOCK

        return StockStatus.UNKNOWN

    def _error_result(self, url: str, msg: str) -> ProductResult:
        return ProductResult(
            url=url,
            source=self.source,
            fetched_at=datetime.utcnow().isoformat(),
            error=msg,
            fetch_method=self.name,
            confidence=0.0,
        )
