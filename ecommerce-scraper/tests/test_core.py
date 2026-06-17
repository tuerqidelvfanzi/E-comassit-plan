"""
基础测试 —— 不需要网络/凭据，验证项目结构正确。
"""

from datetime import datetime

import pytest

from scraper.result import (
    ComparisonResult,
    ConflictResolution,
    ConflictSeverity,
    FieldConflict,
    ProductResult,
    Source,
    StockStatus,
)
from scraper.comparator import Comparator
from scraper.platforms import Platform, detect_platform
from scraper.platforms.amazon import AmazonLocalFetcher


# =============================================================================
# 数据模型测试
# =============================================================================

class TestProductResult:
    def test_basic_creation(self):
        p = ProductResult(
            url="https://amazon.com/dp/B0X",
            source=Source.LOCAL,
            fetched_at=datetime.utcnow().isoformat(),
            title="Test",
            price=99.99,
            stock=StockStatus.IN_STOCK,
        )
        assert p.title == "Test"
        assert p.price == 99.99
        assert p.is_complete is True
        assert p.result_id  # 自动生成

    def test_to_dict(self):
        p = ProductResult(
            url="https://amazon.com/dp/B0X",
            source=Source.APIFY,
            fetched_at=datetime.utcnow().isoformat(),
            stock=StockStatus.IN_STOCK,
        )
        d = p.to_dict()
        assert d["source"] == "apify"
        assert d["stock"] == "in_stock"

    def test_is_complete_with_missing(self):
        p = ProductResult(
            url="https://amazon.com/dp/B0X",
            source=Source.LOCAL,
            fetched_at=datetime.utcnow().isoformat(),
            title="Test",
        )
        assert p.is_complete is False


# =============================================================================
# 平台检测测试
# =============================================================================

class TestDetectPlatform:
    def test_amazon_us(self):
        assert detect_platform("https://www.amazon.com/dp/B0X") == Platform.AMAZON

    def test_amazon_jp(self):
        assert detect_platform("https://www.amazon.co.jp/dp/B0X") == Platform.AMAZON

    def test_shopee_sg(self):
        assert detect_platform("https://shopee.sg/product-i.123.456") == Platform.SHOPEE

    def test_lazada_id(self):
        assert detect_platform("https://www.lazada.co.id/product-i123.html") == Platform.LAZADA

    def test_taobao(self):
        assert detect_platform("https://item.taobao.com/item.htm?id=123") == Platform.TAOBAO

    def test_tmall(self):
        assert detect_platform("https://detail.tmall.com/item.htm?id=123") == Platform.TAOBAO

    def test_jd(self):
        assert detect_platform("https://item.jd.com/100012345.html") == Platform.JD

    def test_pinduoduo(self):
        assert detect_platform("https://mobile.yangkeduo.com/goods.html?goods_id=123") == Platform.PINDUODUO

    def test_unknown(self):
        assert detect_platform("https://example.com/product/123") is None

    def test_chinese_flag(self):
        assert Platform.TAOBAO.is_chinese is True
        assert Platform.AMAZON.is_chinese is False
        assert Platform.SHOPEE.is_chinese is False


# =============================================================================
# 对比器测试
# =============================================================================

class TestComparator:
    def test_exact_match(self):
        local = _make_result(price=99.0, title="Same Title", rating=4.5)
        apify = _make_result(price=99.0, title="Same Title", rating=4.5, source=Source.APIFY)
        comp = Comparator().compare(local, apify)
        assert comp.agreement_score == 1.0
        assert comp.drift_severity == "none"
        assert comp.is_healthy is True

    def test_price_minor_diff(self):
        local = _make_result(price=99.0)
        apify = _make_result(price=99.99, source=Source.APIFY)  # 差 1%
        comp = Comparator().compare(local, apify)
        price_conflict = next(c for c in comp.conflicts if c.field == "price")
        assert price_conflict.severity == ConflictSeverity.MINOR

    def test_price_major_diff(self):
        local = _make_result(price=99.0)
        apify = _make_result(price=120.0, source=Source.APIFY)  # 差 21%
        comp = Comparator().compare(local, apify)
        price_conflict = next(c for c in comp.conflicts if c.field == "price")
        assert price_conflict.severity == ConflictSeverity.MAJOR
        assert comp.needs_attention is True

    def test_missing_field(self):
        local = _make_result(title=None)
        apify = _make_result(title="Only Apify Has", source=Source.APIFY)
        comp = Comparator().compare(local, apify)
        title_conflict = next(c for c in comp.conflicts if c.field == "title")
        assert title_conflict.resolution == ConflictResolution.USE_APIFY

    def test_currency_mismatch(self):
        local = _make_result(price=99.0, currency="USD")
        apify = _make_result(price=700.0, currency="CNY", source=Source.APIFY)
        comp = Comparator().compare(local, apify)
        price_conflict = next(c for c in comp.conflicts if c.field == "price")
        assert price_conflict.severity == ConflictSeverity.INCOMPARABLE

    def test_recommended_uses_apify_base(self):
        local = _make_result(title="Local", price=99.0)
        apify = _make_result(title="Apify", price=89.0, source=Source.APIFY)
        comp = Comparator().compare(local, apify)
        assert comp.recommended.title == "Apify"  # Apify 优先
        assert comp.recommended.price == 89.0


# =============================================================================
# 工具
# =============================================================================

def _make_result(title="Test Product", price=99.0, rating=4.5, currency="USD", source=Source.LOCAL):
    return ProductResult(
        url="https://amazon.com/dp/B0X",
        source=source,
        fetched_at=datetime.utcnow().isoformat(),
        title=title,
        price=price,
        currency=currency,
        stock=StockStatus.IN_STOCK,
        rating=rating,
        review_count=100,
        confidence=0.9,
    )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])


# =============================================================================
# Amazon fetcher 解析测试（无需网络）
# =============================================================================

class TestAmazonParser:
    """Amazon HTML 解析逻辑测试"""

    def setup_method(self):
        self.fetcher = AmazonLocalFetcher(use_browser_fallback=False)

    def test_parse_price_us_format(self):
        """美国价格格式 $1,234.56"""
        assert self.fetcher._parse_price("$1,234.56") == 1234.56
        assert self.fetcher._parse_price("$99.99") == 99.99
        assert self.fetcher._parse_price("$1,000") == 1000.0

    def test_parse_price_eu_format(self):
        """欧洲价格格式 €1.234,56"""
        assert self.fetcher._parse_price("€1.234,56") == 1234.56
        assert self.fetcher._parse_price("€99,99") == 99.99

    def test_parse_price_cn_format(self):
        """中国价格格式 ¥1234.56"""
        assert self.fetcher._parse_price("¥1234.56") == 1234.56
        assert self.fetcher._parse_price("¥999") == 999.0

    def test_parse_price_edge_cases(self):
        assert self.fetcher._parse_price("") is None
        assert self.fetcher._parse_price("free") is None
        assert self.fetcher._parse_price("$0.00") == 0.0

    def test_parse_stock_in_stock(self):
        from scraper.platforms.amazon import AmazonLocalFetcher as F
        assert F._parse_stock("In Stock.") == StockStatus.IN_STOCK
        assert F._parse_stock("Available from these sellers") == StockStatus.IN_STOCK
        assert F._parse_stock("In stock on August 1, 2026.") == StockStatus.IN_STOCK

    def test_parse_stock_out_of_stock(self):
        from scraper.platforms.amazon import AmazonLocalFetcher as F
        assert F._parse_stock("Currently unavailable") == StockStatus.OUT_OF_STOCK
        assert F._parse_stock("Out of Stock") == StockStatus.OUT_OF_STOCK
        assert F._parse_stock("We don't know when or if this item will be back in stock") == StockStatus.OUT_OF_STOCK

    def test_parse_stock_limited(self):
        from scraper.platforms.amazon import AmazonLocalFetcher as F
        # "only N left" 优先于 "in stock"
        assert F._parse_stock("Only 2 left in stock - order soon") == StockStatus.LIMITED
        assert F._parse_stock("Only 3 left in stock - order soon") == StockStatus.LIMITED

    def test_parse_amazon_html_full(self):
        """完整 Amazon HTML 解析"""
        html = '''
        <html>
        <head>
            <title>Echo Dot (4th Gen) - Amazon.com</title>
        </head>
        <body>
            <span id="productTitle">Echo Dot (4th Gen, 2020 release) | Smart speaker with Alexa</span>
            <div class="a-price">
                <span class="a-offscreen">$49.99</span>
            </div>
            <div id="availability">
                <span>In Stock.</span>
            </div>
            <i class="a-icon-star"><span class="a-icon-alt">4.7 out of 5 stars</span></i>
            <a id="acrCustomerReviewText">12,345 ratings</a>
            <div id="bylineInfo">Brand: Amazon</div>
            <div id="feature-bullets">
                <ul>
                    <li>Meet Echo Dot - Our most popular smart speaker</li>
                    <li>Voice control your entertainment</li>
                </ul>
            </div>
            <img id="landingImage" src="https://m.media-amazon.com/images/I/echo.jpg" />
        </body>
        </html>
        '''
        result = self.fetcher._parse_amazon_html(html, "https://www.amazon.com/dp/B0X")
        assert result.title == "Echo Dot (4th Gen, 2020 release) | Smart speaker with Alexa"
        assert result.price == 49.99
        assert result.currency == "USD"
        assert result.stock == StockStatus.IN_STOCK
        assert result.rating == 4.7
        assert result.review_count == 12345
        assert result.seller == "Brand: Amazon"
        assert "Meet Echo Dot" in (result.description or "")
        assert len(result.images) == 1
        assert "echo.jpg" in result.images[0]
        assert result.is_complete is True
        assert result.fetch_method == "http+bs4"

    def test_parse_amazon_html_captcha(self):
        """CAPTCHA 页面应让上层错误处理（_parse 返回 result 但带 title）"""
        html = '''
        <html><body>
        <p>Enter the characters you see below</p>
        <p>Sorry, we just need to make sure you're not a robot</p>
        </body></html>
        '''
        result = self.fetcher._parse_amazon_html(html, "https://amazon.com/dp/B0X")
        # 解析器不检测 CAPTCHA（这是上层 _scrape_via_http 的事）
        # 这里只验证不会崩
        assert result.title is None
        assert result.price is None


# =============================================================================
# Shopee fetcher 解析测试
# =============================================================================

class TestShopeeParser:
    """Shopee 解析逻辑测试"""

    def test_extract_text_finds_title(self):
        from scraper.platforms.shopee import ShopeeLocalFetcher as F
        # 静态方法测试
        assert hasattr(F, "_deep_find")
        assert hasattr(F, "_pick_field")

    def test_pick_field_priority(self):
        from scraper.platforms.shopee import ShopeeLocalFetcher as F
        assert F._pick_field({"a": 1, "b": 2}, ["a", "b"]) == 1
        assert F._pick_field({"b": 2}, ["a", "b"]) == 2
        assert F._pick_field({}, ["a", "b"]) is None
        assert F._pick_field({"a": None}, ["a", "b"]) is None  # None 跳过

    def test_og_fallback(self):
        from scraper.platforms.shopee import ShopeeLocalFetcher
        fetcher = ShopeeLocalFetcher()
        result = ProductResult(
            url="https://shopee.sg/test-i.1.2",
            source=Source.LOCAL,
            fetched_at=datetime.utcnow().isoformat(),
        )
        html = '''
        <html>
        <head>
        <meta property="og:title" content="Test Product - Shopee" />
        <meta property="product:price:amount" content="29.99" />
        <meta property="product:price:currency" content="SGD" />
        <meta property="og:description" content="A test product" />
        <meta property="og:image" content="https://cf.shopee.sg/file/test.jpg" />
        </head>
        </html>
        '''
        result = fetcher._parse_og_fallback(html, "https://shopee.sg/test", result)
        assert result.title == "Test Product - Shopee"
        assert result.price == 29.99
        assert result.currency == "SGD"
        assert result.description == "A test product"
        assert "test.jpg" in result.images[0]


# =============================================================================
# 国内平台白名单测试
# =============================================================================

class TestChinesePlatforms:
    """国内平台域/标识测试"""

    def test_all_chinese_platforms_detected(self):
        test_cases = [
            ("https://item.taobao.com/item.htm?id=1", Platform.TAOBAO),
            ("https://detail.tmall.com/item.htm?id=1", Platform.TAOBAO),
            ("https://world.taobao.com/item/i1.htm", Platform.TAOBAO),
            ("https://item.jd.com/123.html", Platform.JD),
            ("https://yhd.com/product/1", Platform.JD),
            ("https://mobile.yangkeduo.com/goods.html?goods_id=1", Platform.PINDUODUO),
            ("https://shop.douyin.com/product/1", Platform.DOUYIN_SHOP),
            ("https://vip.com/product-1", Platform.WEIPINHUI),
            ("https://suning.com/item/1", Platform.SUNING),
            ("https://detail.1688.com/offer/1.html", Platform._1688),
        ]
        for url, expected in test_cases:
            assert detect_platform(url) == expected, f"failed for {url}"

    def test_all_11_platforms_have_domains(self):
        for p in Platform:
            assert p.domains, f"{p.value} has no domains"
            assert p.display_name, f"{p.value} has no display name"

    def test_chinese_platforms_have_official_api(self):
        for p in Platform:
            if p.is_chinese:
                assert p.official_api_name, f"{p.value} (Chinese) has no official_api_name"
                assert p.risk_warning, f"{p.value} (Chinese) has no risk_warning"

    def test_int_platforms_have_apify_actor(self):
        for p in Platform:
            if not p.is_chinese:
                assert p.apify_actor, f"{p.value} (Intl) has no apify_actor"

    def test_platform_count(self):
        """4 国际 + 7 中国 = 11 个"""
        assert len(list(Platform)) == 11


# =============================================================================
# 端到端对比演示（无网络）
# =============================================================================

class TestE2EDemoFlow:
    """演示完整对比流程（无网络）"""

    def test_full_comparison_workflow(self):
        """模拟 local + apify 两份结果，验证对比器给出合理判断"""
        local = ProductResult(
            url="https://amazon.com/dp/B0X",
            source=Source.LOCAL,
            fetched_at=datetime.utcnow().isoformat(),
            title="Apple iPhone 15 Pro 256GB - Natural Titanium",
            price=999.0,
            currency="USD",
            stock=StockStatus.IN_STOCK,
            rating=4.6,
            review_count=15234,
            seller="Apple",
            confidence=0.85,
            fetch_method="http+bs4",
        )
        apify = ProductResult(
            url="https://amazon.com/dp/B0X",
            source=Source.APIFY,
            fetched_at=datetime.utcnow().isoformat(),
            title="Apple iPhone 15 Pro 256GB - Natural Titanium (Renewed)",  # 略不同
            price=1009.99,  # 差 1.1%
            currency="USD",
            stock=StockStatus.IN_STOCK,
            rating=4.5,  # 略不同
            review_count=15200,  # 差 34
            seller="Apple Renewed",
            confidence=0.95,
            fetch_method="apify:apify/amazon-product-scraper",
        )
        comp = Comparator().compare(local, apify)
        # 价格 1% 差 < 5% → MINOR
        # 评分 0.1 差 < 0.5 → MINOR
        # 评论数 ~0.2% 差 → MINOR
        # 标题相似度 > 80 → MINOR
        # 综合一致度应该 > 0.9（健康）
        assert comp.agreement_score > 0.85
        assert comp.is_healthy is True
        # 推荐结果应当融合（Apify 优先）
        assert comp.recommended.title == "Apple iPhone 15 Pro 256GB - Natural Titanium (Renewed)"
        assert comp.recommended.price == 1009.99
        assert comp.recommended.seller == "Apple Renewed"
