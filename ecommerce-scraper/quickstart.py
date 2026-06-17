"""
Quickstart 演示 —— 5 分钟看到双轨对比效果。

用法：
    python quickstart.py
"""

from __future__ import annotations

import asyncio
import json
from datetime import datetime
from pathlib import Path

from scraper import scrape
from scraper.comparator import Comparator
from scraper.logging import setup_logging
from scraper.platforms import Platform, detect_platform
from scraper.result import ProductResult, Source, StockStatus


log = setup_logging()


# =============================================================================
# Demo 1: 用 mock 数据展示对比流程（无需任何凭据）
# =============================================================================

async def demo_with_mock():
    """Mock 数据演示：手工构造 local + apify 两份结果，看对比器如何工作"""
    print("\n" + "=" * 60)
    print("📦 Demo 1: Mock 数据对比演示（无需凭据）")
    print("=" * 60)

    url = "https://www.amazon.com/dp/B08N5WRWNW"

    # 模拟本地引擎结果（价格略不同）
    local = ProductResult(
        url=url,
        source=Source.LOCAL,
        fetched_at=datetime.utcnow().isoformat(),
        title="Echo Dot (4th Gen, 2020 release) | Smart speaker with Alexa",
        price=49.99,
        currency="USD",
        stock=StockStatus.IN_STOCK,
        description="Meet Echo Dot - Our most popular smart speaker",
        seller="Amazon",
        rating=4.7,
        review_count=12345,
        images=["https://m.media-amazon.com/images/I/61.jpg"],
        confidence=0.85,
        fetch_method="undetected-playwright:stealth",
    )

    # 模拟 Apify 结果
    apify = ProductResult(
        url=url,
        source=Source.APIFY,
        fetched_at=datetime.utcnow().isoformat(),
        title="Echo Dot (4th Gen, 2020 release) | Smart speaker with Alexa",  # 完全一致
        price=49.98,  # 差 $0.01 (0.02%)
        currency="USD",
        stock=StockStatus.IN_STOCK,
        description="Meet Echo Dot - Our most popular smart speaker",
        seller="Amazon",
        rating=4.7,  # 一致
        review_count=12350,  # 差 5 条
        images=["https://m.media-amazon.com/images/I/61.jpg"],
        confidence=0.95,
        fetch_method="apify:apify/amazon-product-scraper",
    )

    # 对比
    comparator = Comparator()
    comp = comparator.compare(local, apify)

    # 打印
    print(f"\n🔍 对比结果：")
    print(f"  一致度: {comp.agreement_score:.1%}")
    print(f"  漂移检测: {comp.drift_severity}")
    print(f"  健康: {'✅' if comp.is_healthy else '⚠️'}")

    print(f"\n📊 字段级冲突：")
    for c in comp.conflicts:
        emoji = {"exact": "✅", "minor": "🟡", "major": "🔴", "incomparable": "⚪"}[c.severity.value]
        print(f"  {emoji} {c.field:20s}  local={str(c.local_value)[:30]:30s}  apify={str(c.apify_value)[:30]:30s}  sim={c.similarity:.2f}")

    print(f"\n🏆 推荐结果：")
    print(f"  标题: {comp.recommended.title}")
    print(f"  价格: ${comp.recommended.price} {comp.recommended.currency}")
    print(f"  库存: {comp.recommended.stock.value if comp.recommended.stock else '?'}")
    print(f"  评分: {comp.recommended.rating} ({comp.recommended.review_count} 评论)")

    print(f"\n💡 解读：")
    print(f"  - 价格差 0.02% < 5% 阈值 → minor 级别，使用 Apify 数据")
    print(f"  - 评论数差 5 条 → 正常波动，不算冲突")
    print(f"  - 一致度 {(comp.agreement_score):.1%} → 健康，无需修正本地规则")


# =============================================================================
# Demo 2: 实际抓取（需要 Apify token）
# =============================================================================

async def demo_real_scrape(url: str, apify_token: str | None = None):
    """真实抓取演示"""
    print("\n" + "=" * 60)
    print(f"🌐 Demo 2: 真实双轨抓取 → {url}")
    print("=" * 60)

    # 1. 平台检测
    pf = detect_platform(url)
    if pf is None:
        print(f"❌ URL 不在白名单: {url}")
        return
    print(f"🎯 平台: {pf.display_name}")

    if pf.is_chinese:
        print(f"⚠️  这是中国电商平台。竞品抓取有风险，详见 README。")
        if pf.risk_warning:
            print(f"   {pf.risk_warning}")

    # 2. 抓取
    result = await scrape(url, use_apify=bool(apify_token), apify_token=apify_token)

    # 3. 打印
    print(f"\n⏱️  耗时: {result.total_duration_ms}ms")
    print(f"✅ 成功: {result.success}")

    if result.local:
        print(f"\n📍 本地引擎: {'✓' if not result.local.error else '✗ ' + (result.local.error or '')}")
        if not result.local.error:
            print(f"   标题: {result.local.title}")
            print(f"   价格: {result.local.currency} {result.local.price}")

    if result.apify:
        print(f"\n☁️  Apify: {'✓' if not result.apify.error else '✗ ' + (result.apify.error or '')}")
        if not result.apify.error:
            print(f"   标题: {result.apify.title}")
            print(f"   价格: {result.apify.currency} {result.apify.price}")

    if result.comparison:
        print(f"\n🔍 对比: 一致度 {result.comparison.agreement_score:.1%}, 漂移 {result.comparison.drift_severity}")
        if result.comparison.needs_attention:
            print(f"   🚨 需要关注：详情见 data/divergences/")
    else:
        print(f"\n⚠️  无对比数据（仅单源）")


# =============================================================================
# Demo 3: 自家淘宝店铺（需要商家 API 凭据）
# =============================================================================

async def demo_own_taobao_store():
    """自家淘宝店铺演示"""
    print("\n" + "=" * 60)
    print("🏪 Demo 3: 自己淘宝店铺（官方 API）")
    print("=" * 60)

    from scraper.merchant_api import get_merchant_fetcher
    from scraper.config import settings

    if not all([settings.openai_api_key, False]):  # 简化判断
        # 实际应该检查 TAOBAO_APP_KEY 等
        pass

    # 检查环境变量
    import os
    app_key = os.getenv("TAOBAO_APP_KEY")
    app_secret = os.getenv("TAOBAO_APP_SECRET")
    access_token = os.getenv("TAOBAO_ACCESS_TOKEN")

    if not all([app_key, app_secret, access_token]):
        print("⚠️  未配置 TAOBAO_APP_KEY / _APP_SECRET / _ACCESS_TOKEN")
        print("   申请地址: https://open.taobao.com")
        print("   配置方法: 复制 .env.example 为 .env 并填入")
        return

    fetcher = get_merchant_fetcher(
        Platform.TAOBAO,
        app_key=app_key,
        app_secret=app_secret,
        access_token=access_token,
    )

    if fetcher is None:
        print("❌ Taobao merchant fetcher 未实现")
        return

    # 健康检查
    healthy = await fetcher.health_check()
    print(f"🏥 健康检查: {'✅' if healthy else '❌'}")

    if healthy:
        # 替换为你的真实商品 ID
        item_id = input("\n请输入你的淘宝商品 ID (num_iid): ").strip()
        if item_id:
            product = await fetcher.fetch_product(item_id)
            if product:
                print(f"\n📦 商品信息：")
                print(f"  标题: {product.title}")
                print(f"  价格: ¥{product.price}")
                print(f"  库存: {product.stock.value if product.stock else '?'}")
                print(f"  来源: {product.fetch_method}")


# =============================================================================
# 主入口
# =============================================================================

async def main():
    print("""
╔══════════════════════════════════════════════════════════╗
║   ecommerce-scraper  v0.1.0  双轨制抓取引擎             ║
╚══════════════════════════════════════════════════════════╝
    """)

    # 启动时弹 4 个标签提醒手动测代理质量
    from proxy_doctor import prompt_manual_proxy_check
    prompt_manual_proxy_check()

    # Demo 1: 永远可跑
    await demo_with_mock()

    # Demo 2: 真实抓取
    import os
    apify_token = os.getenv("APIFY_TOKEN")

    print("\n" + "─" * 60)
    choice = input("运行真实抓取演示？(需要 APIFY_TOKEN 环境变量) [y/N]: ").strip().lower()

    if choice == "y":
        if not apify_token:
            print("❌ 未设置 APIFY_TOKEN")
            return
        url = input("输入商品 URL: ").strip()
        if url:
            await demo_real_scrape(url, apify_token)

    # Demo 3: 商家 API
    print("\n" + "─" * 60)
    choice = input("运行自家淘宝店铺演示？(需要 TAOBAO_* 环境变量) [y/N]: ").strip().lower()
    if choice == "y":
        await demo_own_taobao_store()

    print("\n✨ Done.\n")


if __name__ == "__main__":
    asyncio.run(main())
