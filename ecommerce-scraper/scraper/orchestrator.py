"""
编排器 —— 单入口，双轨并行 + 自动对比。
"""

from __future__ import annotations

import asyncio
import time
from datetime import datetime
from typing import Optional

from scraper.comparator import Comparator
from scraper.config import settings
from scraper.fetcher import Fetcher
from scraper.logging import log
from scraper.platforms import Platform, detect_platform
from scraper.result import (
    DualScrapeResult,
    ProductResult,
    Source,
    StockStatus,
)


# 全局 fetcher 注册表（懒加载）
_local_fetcher: Optional[Fetcher] = None
_apify_fetcher: Optional[Fetcher] = None


def get_local_fetcher() -> Fetcher:
    """获取本地 fetcher（懒加载，避免循环导入）"""
    global _local_fetcher
    if _local_fetcher is None:
        from scraper.platforms.amazon import AmazonLocalFetcher
        from scraper.platforms.shopee import ShopeeLocalFetcher
        from scraper.platforms.lazada import LazadaLocalFetcher
        from scraper.platforms.tiktok_shop import TikTokShopLocalFetcher
        from scraper.platforms.domestic import (
            TaobaoLocalFetcher,
            JDLocalFetcher,
            PinduoduoLocalFetcher,
            DouyinShopLocalFetcher,
            WeipinhuiLocalFetcher,
            SuningLocalFetcher,
            Aliyun1688LocalFetcher,
        )

        _local_fetcher = _CompositeLocalFetcher([
            # 国际电商（完整实现：HTTP+BS4 + Playwright fallback）
            ("amazon", AmazonLocalFetcher()),
            ("shopee", ShopeeLocalFetcher()),
            ("lazada", LazadaLocalFetcher()),
            ("tiktok_shop", TikTokShopLocalFetcher()),
            # 中国电商（高风险，本地 fetcher 仅做警告占位）
            # 抓竞品风险高，请用 Apify；自己店铺请用 merchant_api
            ("taobao", TaobaoLocalFetcher()),
            ("jd", JDLocalFetcher()),
            ("pinduoduo", PinduoduoLocalFetcher()),
            ("douyin_shop", DouyinShopLocalFetcher()),
            ("weipinhui", WeipinhuiLocalFetcher()),
            ("suning", SuningLocalFetcher()),
            ("1688", Aliyun1688LocalFetcher()),
        ])
    return _local_fetcher


def get_apify_fetcher() -> Optional[Fetcher]:
    """获取 Apify fetcher（无 token 时返回 None）"""
    global _apify_fetcher
    if _apify_fetcher is None:
        if not settings.apify_token:
            return None
        from scraper.apify import ApifyFetcher
        _apify_fetcher = ApifyFetcher(token=settings.apify_token)
    return _apify_fetcher


# =============================================================================
# 主入口
# =============================================================================

async def scrape(
    url: str,
    *,
    use_apify: bool = True,
    apify_token: Optional[str] = None,
    timeout: float = 90.0,
) -> DualScrapeResult:
    """
    单 URL 抓取入口（双轨制）。

    流程：
    1. 探测平台（白名单检查，淘宝/京东会被拒）
    2. 并行执行 LocalFetcher + ApifyFetcher
    3. 字段级对比
    4. 漂移检测
    5. 返回 DualScrapeResult

    Args:
        url: 目标商品 URL
        use_apify: 是否启用 Apify 对比轨（无 token 自动降级）
        apify_token: 临时覆盖 Apify token
        timeout: 单次抓取超时（秒）

    Returns:
        DualScrapeResult：包含 local + apify + comparison
    """
    start = time.monotonic()
    result = DualScrapeResult(url=url)

    # === 1. 平台识别（白名单检查）===
    try:
        platform = detect_platform(url)
    except ValueError as e:
        # 黑名单命中（淘宝/京东等）
        result.error = str(e)
        result.success = False
        return result

    if platform is None:
        result.error = f"❌ URL 不在白名单平台内: {url}\n   支持: {[p.value for p in Platform]}"
        result.success = False
        return result

    log.info(f"🎯 Detected platform: {platform.display_name} ({url})")

    # === 2. 准备 fetcher ===
    local = get_local_fetcher()
    apify = get_apify_fetcher() if use_apify else None
    if apify_token:
        from scraper.apify import ApifyFetcher
        apify = ApifyFetcher(token=apify_token)
        use_apify = True

    # === 3. 并行双轨 ===
    tasks = {
        "local": asyncio.create_task(
            _safe_fetch(local, url, platform, timeout),
            name="local",
        ),
    }
    if use_apify and apify is not None:
        tasks["apify"] = asyncio.create_task(
            _safe_fetch(apify, url, platform, timeout),
            name="apify",
        )
    else:
        log.warning("⚠️  Apify 未启用（缺 token 或 --no-apify），仅运行本地引擎")

    # 收集结果（异常也带回去，不要崩）
    completed = await asyncio.gather(*tasks.values(), return_exceptions=True)
    name_to_result = dict(zip(tasks.keys(), completed))

    result.local = _unwrap(name_to_result.get("local"))
    result.apify = _unwrap(name_to_result.get("apify"))

    # === 4. 对比（双轨都有时才做）===
    if result.local and result.apify and not result.local.error and not result.apify.error:
        comparator = Comparator()
        result.comparison = comparator.compare(result.local, result.apify)

        # === 5. 漂移告警 ===
        if result.comparison.needs_attention:
            log.warning(
                f"🚨 Drift detected: {result.comparison.drift_severity} | "
                f"agreement={result.comparison.agreement_score:.2%}"
            )
            await _on_drift(result)

    # === 6. 成功判定 ===
    result.success = bool(
        (result.local and not result.local.error)
        or (result.apify and not result.apify.error)
    )
    if not result.success and not result.error:
        local_err = result.local.error if result.local else "no local result"
        apify_err = result.apify.error if result.apify else "no apify result"
        result.error = f"All paths failed. local: {local_err} | apify: {apify_err}"

    result.total_duration_ms = int((time.monotonic() - start) * 1000)
    log.info(
        f"{'✅' if result.success else '❌'} scrape done | "
        f"{result.total_duration_ms}ms | "
        f"local={'✓' if result.local and not result.local.error else '✗'} "
        f"apify={'✓' if result.apify and not result.apify.error else '✗'}"
    )
    return result


async def scrape_batch(
    urls: list[str],
    *,
    use_apify: bool = True,
    concurrency: int = 3,
    apify_token: Optional[str] = None,
) -> list[DualScrapeResult]:
    """
    批量抓取（带并发控制和限流）。

    Args:
        urls: URL 列表
        use_apify: 是否启用 Apify 对比
        concurrency: 最大并发数
        apify_token: Apify token 覆盖
    """
    sem = asyncio.Semaphore(concurrency)

    async def _bounded(u: str) -> DualScrapeResult:
        async with sem:
            r = await scrape(u, use_apify=use_apify, apify_token=apify_token)
            # 限流
            import random
            delay = random.gauss(60.0 / settings.rate_limit_per_min, settings.rate_limit_jitter)
            await asyncio.sleep(max(0.5, delay))
            return r

    tasks = [_bounded(u) for u in urls]
    return await asyncio.gather(*tasks)


# =============================================================================
# 内部工具
# =============================================================================

async def _safe_fetch(
    fetcher: Fetcher,
    url: str,
    platform: Platform,
    timeout: float,
) -> ProductResult:
    """带超时的安全抓取，永不抛异常"""
    try:
        return await asyncio.wait_for(
            fetcher.fetch(url, platform=platform),
            timeout=timeout,
        )
    except asyncio.TimeoutError:
        return ProductResult(
            url=url, source=fetcher.source,
            fetched_at=datetime.utcnow().isoformat(),
            error=f"timeout after {timeout}s",
            fetch_method=fetcher.name,
        )
    except Exception as e:
        log.error(f"💥 {fetcher.name} crashed: {e}")
        return ProductResult(
            url=url, source=fetcher.source,
            fetched_at=datetime.utcnow().isoformat(),
            error=f"{type(e).__name__}: {e}",
            fetch_method=fetcher.name,
        )


def _unwrap(value) -> Optional[ProductResult]:
    if isinstance(value, BaseException):
        log.error(f"Task failed: {value}")
        return None
    return value


async def _on_drift(result: DualScrapeResult) -> None:
    """漂移响应：记录 + 通知（可扩展）"""
    from pathlib import Path
    import json

    log_dir = Path(settings.divergence_log_dir)
    log_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{result.local.result_id}.json"
    log_path = log_dir / filename

    log_path.write_text(
        json.dumps(result.to_dict(), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    log.info(f"📝 Divergence logged: {log_path}")

    # TODO: 接 Slack / 邮件 / Sentry 告警
    # TODO: 可选：触发本地引擎的自校正（用 Apify 结果回填）


# =============================================================================
# 内部：组合本地 fetcher（按平台分发）
# =============================================================================

class _CompositeLocalFetcher(Fetcher):
    """组合器：根据 URL 路由到具体平台的本地 fetcher"""

    name = "local-composite"
    source = Source.LOCAL

    def __init__(self, fetchers: list[tuple[str, Fetcher]]):
        self._fetchers = dict(fetchers)

    async def fetch(self, url: str, **kwargs) -> ProductResult:
        platform = kwargs.get("platform") or detect_platform(url)
        if platform is None:
            return ProductResult(
                url=url, source=self.source,
                fetched_at=datetime.utcnow().isoformat(),
                error="platform not detected",
                fetch_method=self.name,
            )
        fetcher = self._fetchers.get(platform.value)
        if fetcher is None:
            return ProductResult(
                url=url, source=self.source,
                fetched_at=datetime.utcnow().isoformat(),
                error=f"no local fetcher for platform {platform.value}",
                fetch_method=self.name,
            )
        return await fetcher.fetch(url, **kwargs)

    async def health_check(self) -> bool:
        return any(await f.health_check() for f in self._fetchers.values())
