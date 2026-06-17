"""
MCP Server 入口 —— 让 Claude Code 直接调用。
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Optional

try:
    from mcp.server.fastmcp import FastMCP
except ImportError:
    raise ImportError("需要安装 mcp: pip install mcp")

from scraper import __version__, scrape
from scraper.config import settings
from scraper.logging import setup_logging
from scraper.merchant_api import get_merchant_fetcher
from scraper.platforms import Platform


mcp = FastMCP(
    "escrape",
    instructions=(
        "E-commerce scraper with local + Apify auto-comparison. "
        "Supports 12 platforms (Amazon/Shopee/Lazada/TikTok Shop + 7 Chinese). "
        "Always returns dual results + comparison score. "
        "For own Chinese store, use my_product with merchant API."
    ),
)
log = setup_logging()

# 进程级标记：MCP server 启动后第一次工具调用时才弹窗
_proxy_check_done: set = set()


@mcp.tool()
async def scrape(url: str, no_apify: bool = False, apify_token: Optional[str] = None) -> str:
    """
    Scrape a single product URL with dual-path auto-comparison.

    Args:
        url: Product URL (Amazon/Shopee/Lazada/TikTok Shop/Chinese e-commerce)
        no_apify: If True, skip Apify (only local engine)
        apify_token: Override Apify token

    Returns:
        JSON with: local result, apify result, comparison (agreement, conflicts, drift)
    """
    # 第一次调用时弹 4 个标签提醒手动测代理（常驻进程不刷屏）
    if not _proxy_check_done:
        from proxy_doctor import prompt_manual_proxy_check
        prompt_manual_proxy_check()
        _proxy_check_done.add(True)

    result = await scrape(
        url,
        use_apify=not no_apify,
        apify_token=apify_token,
    )
    return json.dumps(result.to_dict(), ensure_ascii=False, indent=2)


@mcp.tool()
async def my_product(platform: str, item_id: str) -> str:
    """
    Fetch a product from YOUR OWN store using official merchant API.

    Use this for Chinese e-commerce (淘宝/京东/拼多多/抖店) - it's legal, stable, official.

    Required env vars: TAOBAO_APP_KEY, TAOBAO_APP_SECRET, TAOBAO_ACCESS_TOKEN (for Taobao)
                       JD_* / DOUYIN_* / etc. (other platforms)

    Args:
        platform: One of "taobao", "jd", "pinduoduo", "douyin_shop", "1688", "weipinhui", "suning"
        item_id: Product ID (num_iid for Taobao, skuId for JD, etc.)

    Returns:
        JSON with your store's product data (price, stock, etc.)
    """
    pf = Platform(platform)
    if not pf.is_chinese:
        return json.dumps({"error": f"{platform} 不支持商家 API 路径，请用 scrape()"}, ensure_ascii=False)

    # 读取凭据
    creds = _load_merchant_creds(platform)
    if not all(creds.get(k) for k in ("app_key", "app_secret", "access_token")):
        return json.dumps({
            "error": f"缺少 {platform.upper()}_APP_KEY / _APP_SECRET / _ACCESS_TOKEN 环境变量",
            "help": f"申请地址：{pf.official_api_name}",
        }, ensure_ascii=False)

    fetcher = get_merchant_fetcher(pf, **creds)
    if fetcher is None:
        return json.dumps({"error": f"{platform} 商家 API fetcher 未实现"}, ensure_ascii=False)

    product = await fetcher.fetch_product(item_id)
    if product is None:
        return json.dumps({"error": f"未找到商品 {item_id}"}, ensure_ascii=False)

    return json.dumps(product.to_dict(), ensure_ascii=False, indent=2)


@mcp.tool()
async def divergences(since: Optional[str] = None, limit: int = 20) -> str:
    """
    View historical comparison drift records.

    Use to detect when local scraper drifts from Apify (target site changed layout, etc.)

    Args:
        since: ISO date string, e.g. "2025-01-01"
        limit: Max number of records to return

    Returns:
        JSON array of drift records
    """
    log_dir = Path(settings.divergence_log_dir)
    if not log_dir.exists():
        return json.dumps({"records": [], "message": "无漂移记录"}, ensure_ascii=False)

    files = sorted(log_dir.glob("*.json"), reverse=True)
    if since:
        files = [f for f in files if f.stem[:10] >= since]
    files = files[:limit]

    records = []
    for f in files:
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            comp = data.get("comparison", {})
            records.append({
                "file": f.name,
                "url": data.get("url"),
                "compared_at": comp.get("compared_at"),
                "agreement": comp.get("agreement_score"),
                "drift_severity": comp.get("drift_severity"),
                "conflicts": len([c for c in comp.get("conflicts", []) if c.get("severity") != "exact"]),
            })
        except Exception as e:
            log.warning(f"Failed to read {f}: {e}")

    return json.dumps({"count": len(records), "records": records}, ensure_ascii=False, indent=2)


@mcp.tool()
async def list_platforms() -> str:
    """
    List all supported platforms with their paths (scrape vs merchant API).
    """
    platforms = []
    for p in Platform:
        platforms.append({
            "value": p.value,
            "display_name": p.display_name,
            "domains": p.domains,
            "is_chinese": p.is_chinese,
            "apify_actor": p.apify_actor,
            "official_api": p.official_api_name,
            "risk_warning": p.risk_warning,
        })
    return json.dumps({"version": __version__, "platforms": platforms}, ensure_ascii=False, indent=2)


def _load_merchant_creds(platform: str) -> dict:
    """加载商家 API 凭据（从环境变量）"""
    import os
    prefix = platform.upper()
    return {
        "app_key": os.getenv(f"{prefix}_APP_KEY"),
        "app_secret": os.getenv(f"{prefix}_APP_SECRET"),
        "access_token": os.getenv(f"{prefix}_ACCESS_TOKEN"),
    }


if __name__ == "__main__":
    log.info(f"🚀 Starting escrape MCP server (v{__version__})")
    mcp.run(transport="stdio")
