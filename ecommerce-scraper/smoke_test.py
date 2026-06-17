"""
Smoke test —— 端到端验证项目可用，无需任何凭据或网络。

跑法:
    PYTHONIOENCODING=utf-8 python smoke_test.py
"""
from __future__ import annotations

import asyncio
import sys
from datetime import datetime

# 颜色支持（无颜色也无所谓）
def green(s):  return f"\033[92m{s}\033[0m"
def red(s):    return f"\033[91m{s}\033[0m"
def yellow(s): return f"\033[93m{s}\033[0m"
def blue(s):   return f"\033[94m{s}\033[0m"


def step(name: str):
    print(f"\n{blue('━━━ ' + name + ' ━━━')}")


def assert_ok(cond: bool, msg: str):
    if cond:
        print(f"  {green('✅')} {msg}")
    else:
        print(f"  {red('❌')} {msg}")
        sys.exit(1)


async def smoke():
    # =================================================================
    # 1. 基础导入
    # =================================================================
    step("1. 基础导入")
    from scraper import scrape
    from scraper.comparator import Comparator
    from scraper.config import settings
    from scraper.fetcher import Fetcher
    from scraper.platforms import Platform, detect_platform
    from scraper.result import (
        ComparisonResult, ConflictResolution, ConflictSeverity,
        FieldConflict, ProductResult, Source, StockStatus,
    )
    assert_ok(True, "所有核心模块导入成功")

    # =================================================================
    # 2. 平台枚举
    # =================================================================
    step("2. 平台枚举")
    platforms = list(Platform)
    assert_ok(len(platforms) == 11, f"11 个平台 (4 国际 + 7 中国): {[p.value for p in platforms]}")

    intl = [p for p in platforms if not p.is_chinese]
    cn = [p for p in platforms if p.is_chinese]
    assert_ok(len(intl) == 4, f"4 个国际平台: {[p.value for p in intl]}")
    assert_ok(len(cn) == 7, f"7 个中国平台: {[p.value for p in cn]}")

    for p in platforms:
        assert_ok(bool(p.display_name), f"{p.value}: display_name={p.display_name}")
        assert_ok(bool(p.domains), f"{p.value}: {len(p.domains)} domains")

    # =================================================================
    # 3. 平台检测
    # =================================================================
    step("3. URL 平台检测")
    test_cases = [
        ("https://www.amazon.com/dp/B0X", Platform.AMAZON),
        ("https://www.amazon.co.jp/dp/B0X", Platform.AMAZON),
        ("https://shopee.sg/product-i.1.2", Platform.SHOPEE),
        ("https://www.lazada.co.id/product-i1.html", Platform.LAZADA),
        ("https://shop.tiktok.com/view-product/1", Platform.TIKTOK_SHOP),
        ("https://item.taobao.com/item.htm?id=1", Platform.TAOBAO),
        ("https://detail.tmall.com/item.htm?id=1", Platform.TAOBAO),
        ("https://item.jd.com/100.html", Platform.JD),
        ("https://mobile.yangkeduo.com/goods.html?goods_id=1", Platform.PINDUODUO),
        ("https://shop.douyin.com/product/1", Platform.DOUYIN_SHOP),
        ("https://detail.1688.com/offer/1.html", Platform._1688),
    ]
    for url, expected in test_cases:
        got = detect_platform(url)
        assert_ok(got == expected, f"{url[:50]:50s} → {got.value if got else 'None'}")

    unknown = detect_platform("https://example.com/foo")
    assert_ok(unknown is None, f"未知 URL → None")

    # =================================================================
    # 4. 数据模型
    # =================================================================
    step("4. 数据模型")
    p = ProductResult(
        url="https://amazon.com/dp/B0X",
        source=Source.LOCAL,
        fetched_at=datetime.utcnow().isoformat(),
        title="iPhone 15 Pro",
        price=999.0,
        currency="USD",
        stock=StockStatus.IN_STOCK,
        rating=4.6,
        review_count=15234,
    )
    assert_ok(p.is_complete, f"is_complete=True (title+price+stock)")
    assert_ok(p.result_id, f"result_id 自动生成: {p.result_id}")
    d = p.to_dict()
    assert_ok(d["source"] == "local", "to_dict 序列化正确")
    assert_ok(d["stock"] == "in_stock", "to_dict stock=enum_value")

    # =================================================================
    # 5. 对比器
    # =================================================================
    step("5. 对比器")
    local = ProductResult(
        url="https://amazon.com/dp/B0X",
        source=Source.LOCAL, fetched_at=datetime.utcnow().isoformat(),
        title="Echo Dot 4th Gen", price=49.99, currency="USD",
        stock=StockStatus.IN_STOCK, rating=4.7, review_count=1000,
    )
    apify = ProductResult(
        url="https://amazon.com/dp/B0X",
        source=Source.APIFY, fetched_at=datetime.utcnow().isoformat(),
        title="Echo Dot 4th Gen", price=50.0, currency="USD",  # +$0.01
        stock=StockStatus.IN_STOCK, rating=4.7, review_count=1010,
    )
    comp = Comparator().compare(local, apify)
    assert_ok(comp.agreement_score > 0.95, f"高一致度: {comp.agreement_score:.1%}")
    assert_ok(comp.drift_severity == "none", f"无漂移: {comp.drift_severity}")
    assert_ok(comp.is_healthy, f"健康: {comp.is_healthy}")

    # 制造一个 major diff
    apify_bad = ProductResult(
        url="https://amazon.com/dp/B0X",
        source=Source.APIFY, fetched_at=datetime.utcnow().isoformat(),
        title="Echo Dot 4th Gen", price=199.99, currency="USD",  # 4x 价格
        stock=StockStatus.OUT_OF_STOCK, rating=4.7, review_count=1010,
    )
    comp2 = Comparator().compare(local, apify_bad)
    assert_ok(comp2.needs_attention, f"价格 4x 触发 needs_attention: drift={comp2.drift_severity}")

    # =================================================================
    # 6. 编排器（白名单检查）
    # =================================================================
    step("6. 编排器 - 白名单")
    # 未知 URL 应失败
    result = await scrape("https://example.com/foo", use_apify=False)
    assert_ok(not result.success, f"未知 URL: success={result.success}")
    assert_ok("不在白名单" in (result.error or ""), f"error 信息: {(result.error or '')[:50]}")

    # =================================================================
    # 7. 国内平台 - 安全拒绝
    # =================================================================
    step("7. 国内平台 - 安全拒绝/降级")
    result_cn = await scrape("https://item.taobao.com/item.htm?id=1", use_apify=False)
    # 淘宝 url 不在白名单（非 detect_platform 的支持），应走 unknown 分支
    if result_cn.local:
        assert_ok(
            "未实现" in (result_cn.local.error or "")
            or "请用" in (result_cn.local.error or "")
            or result_cn.local.error is not None,
            f"淘宝本地 fetcher 返回安全错误: {(result_cn.local.error or '')[:60]}"
        )

    # =================================================================
    # 8. 商家 API factory
    # =================================================================
    step("8. 商家 API factory")
    from scraper.merchant_api import get_merchant_fetcher
    fetcher = get_merchant_fetcher(
        Platform.TAOBAO,
        app_key="test_key", app_secret="test_secret", access_token="test_token",
    )
    assert_ok(fetcher is not None, f"淘宝 merchant fetcher 实例化: {type(fetcher).__name__}")
    assert_ok(fetcher.name == "taobao-merchant-api", f"name: {fetcher.name}")

    # 签名算法验证（淘宝/京东/拼多多）
    from scraper.merchant_api import TaobaoMerchantFetcher, JDMerchantFetcher, PinduoduoMerchantFetcher
    tb = TaobaoMerchantFetcher("key", "secret", "tok")
    sign = tb.sign({"method": "test", "foo": "bar"})
    assert_ok(len(sign) == 32, f"淘宝 MD5 sign 长度=32: {sign}")

    jd = JDMerchantFetcher("key", "secret", "tok")
    sign_jd = jd.sign({"method": "test", "foo": "bar"})
    assert_ok(len(sign_jd) == 64, f"京东 HMAC-SHA256 sign 长度=64: {sign_jd}")

    # =================================================================
    # 9. 漂移日志目录
    # =================================================================
    step("9. 漂移日志目录")
    from pathlib import Path
    div_dir = Path(settings.divergence_log_dir)
    div_dir.mkdir(parents=True, exist_ok=True)
    assert_ok(div_dir.is_dir(), f"divergence_log_dir 可用: {div_dir}")

    # =================================================================
    # 10. CLI 可导入
    # =================================================================
    step("10. CLI 模块")
    import cli
    assert_ok(hasattr(cli, "main"), "cli.main 存在")
    assert_ok(callable(cli.main), "cli.main 可调用")

    # =================================================================
    # 11. MCP server 可导入
    # =================================================================
    step("11. MCP server")
    import mcp_server
    assert_ok(hasattr(mcp_server, "mcp"), "mcp_server.mcp (FastMCP 实例) 存在")
    assert_ok(callable(getattr(mcp_server.mcp, "run", None)), "mcp.run() 可调用")

    print(f"\n{green('━' * 60)}")
    print(f"{green('  ✅ 全部 smoke test 通过！项目可用。')}")
    print(f"{green('━' * 60)}\n")


if __name__ == "__main__":
    asyncio.run(smoke())
