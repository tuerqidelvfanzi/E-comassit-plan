"""
CLI 入口 —— `escrape` 命令。
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path
from typing import Optional

import click
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import box

from scraper import __version__, scrape, scrape_batch
from scraper.config import settings
from scraper.logging import setup_logging
from scraper.platforms import Platform, detect_platform
from scraper.merchant_api import get_merchant_fetcher


console = Console()
log = setup_logging()


@click.group()
@click.version_option(__version__, prog_name="escrape")
@click.option("--no-proxy-check", is_flag=True, help="跳过启动时弹 4 个标签提醒手动测代理")
def cli(no_proxy_check: bool):
    """🛒  ecommerce-scraper  ——  双轨制电商抓取 + Apify 自动对比"""
    # 启动时弹 4 个标签提醒手动测代理（除非显式跳过）
    if not no_proxy_check and not _PROXY_CHECK_DONE:
        from proxy_doctor import prompt_manual_proxy_check
        prompt_manual_proxy_check()
        _PROXY_CHECK_DONE.add(True)


# 模块级标志：同一进程内只弹一次（避免 batch 多 URL 时刷屏）
_PROXY_CHECK_DONE: set = set()


# =============================================================================
# scrape 单 URL
# =============================================================================

@cli.command()
@click.argument("url")
@click.option("--no-apify", is_flag=True, help="仅本地引擎，不调 Apify")
@click.option("--apify-token", default=None, help="Apify token 覆盖")
@click.option("--timeout", default=90, help="单次抓取超时（秒）")
@click.option("--json", "as_json", is_flag=True, help="输出 JSON 格式")
def scrape_cmd(url: str, no_apify: bool, apify_token: Optional[str], timeout: int, as_json: bool):
    """单 URL 抓取（双轨 + 对比）"""
    result = asyncio.run(scrape(
        url,
        use_apify=not no_apify,
        apify_token=apify_token,
        timeout=timeout,
    ))

    if as_json:
        click.echo(json.dumps(result.to_dict(), ensure_ascii=False, indent=2))
        return

    _print_result(result)


# =============================================================================
# batch 批量
# =============================================================================

@cli.command()
@click.argument("file", type=click.Path(exists=True))
@click.option("--no-apify", is_flag=True, help="仅本地")
@click.option("--concurrency", default=3, help="最大并发")
@click.option("--output", "-o", default="results.jsonl", help="输出文件")
def batch(file: str, no_apify: bool, concurrency: int, output: str):
    """从文件读 URL 列表（每行一个），批量抓取"""
    urls = [line.strip() for line in Path(file).read_text(encoding="utf-8").splitlines() if line.strip()]
    console.print(f"📦 Loaded {len(urls)} URLs")

    results = asyncio.run(scrape_batch(
        urls,
        use_apify=not no_apify,
        concurrency=concurrency,
    ))

    # 写 JSONL
    with open(output, "w", encoding="utf-8") as f:
        for r in results:
            f.write(json.dumps(r.to_dict(), ensure_ascii=False) + "\n")
    console.print(f"✅ Saved to {output}")

    # 汇总
    _print_batch_summary(results)


# =============================================================================
# my-product 商家自己店铺（官方 API）
# =============================================================================

@cli.command("my-product")
@click.option("--platform", required=True, type=click.Choice([p.value for p in Platform if p.is_chinese]))
@click.option("--item-id", required=True, help="商品 ID")
@click.option("--app-key", envvar="TAOBAO_APP_KEY")
@click.option("--app-secret", envvar="TAOBAO_APP_SECRET")
@click.option("--access-token", envvar="TAOBAO_ACCESS_TOKEN")
def my_product_cmd(platform: str, item_id: str, app_key: Optional[str], app_secret: Optional[str], access_token: Optional[str]):
    """拉取自己店铺的商品（用商家后台官方 API）"""
    pf = Platform(platform)

    if not all([app_key, app_secret, access_token]):
        console.print(f"[red]❌ 需要 app_key / app_secret / access_token[/red]")
        console.print(f"   商家后台：{pf.official_api_name}")
        return

    fetcher = get_merchant_fetcher(pf, app_key=app_key, app_secret=app_secret, access_token=access_token)
    if fetcher is None:
        console.print(f"[red]❌ {pf.display_name} 的商家 API fetcher 未实现[/red]")
        return

    async def _run():
        return await fetcher.fetch_product(item_id)

    result = asyncio.run(_run())

    if result is None:
        console.print(f"[red]❌ 未找到商品 {item_id}[/red]")
        return

    _print_product(result, title=f"自己店铺商品（{pf.display_name}）")


# =============================================================================
# divergences 漂移记录
# =============================================================================

@cli.command()
@click.option("--since", default=None, help="起始日期 YYYY-MM-DD")
@click.option("--limit", default=20, help="最多显示条数")
def divergences(since: Optional[str], limit: int):
    """查看历史对比漂移记录"""
    from datetime import datetime

    log_dir = Path(settings.divergence_log_dir)
    if not log_dir.exists():
        console.print("[yellow]📂 漂移日志目录不存在[/yellow]")
        return

    files = sorted(log_dir.glob("*.json"), reverse=True)
    if since:
        cutoff = datetime.fromisoformat(since).date()
        files = [f for f in files if f.stem[:10] >= str(cutoff)]
    files = files[:limit]

    if not files:
        console.print("[green]✅ 没有漂移记录（所有抓取一致度 > 阈值）[/green]")
        return

    table = Table(title=f"漂移记录（最近 {len(files)} 条）", box=box.SIMPLE)
    table.add_column("时间", style="cyan")
    table.add_column("URL", style="blue", overflow="ellipsis", max_width=50)
    table.add_column("一致度", justify="right")
    table.add_column("漂移等级", style="red")
    table.add_column("冲突数", justify="right")

    for f in files:
        data = json.loads(f.read_text(encoding="utf-8"))
        comp = data.get("comparison", {})
        table.add_row(
            data.get("comparison", {}).get("compared_at", "")[:19],
            data.get("url", "")[:50],
            f"{comp.get('agreement_score', 0):.1%}",
            comp.get("drift_severity", "?"),
            str(len([c for c in comp.get("conflicts", []) if c.get("severity") != "exact"])),
        )
    console.print(table)


# =============================================================================
# 输出美化
# =============================================================================

def _print_result(result):
    """打印单次抓取结果"""
    if not result.success:
        console.print(Panel(f"[red]❌ {result.error or 'all paths failed'}[/red]", title="失败", border_style="red"))
        return

    console.print(f"\n[bold green]✅ 抓取成功 ({result.total_duration_ms}ms)[/bold green]\n")

    # Local
    if result.local and not result.local.error:
        _print_product(result.local, "本地引擎 (LocalFetcher)")
    elif result.local:
        console.print(f"[yellow]⚠️  本地引擎失败: {result.local.error}[/yellow]\n")

    # Apify
    if result.apify and not result.apify.error:
        _print_product(result.apify, "Apify 云端")
    elif result.apify:
        console.print(f"[yellow]⚠️  Apify 失败: {result.apify.error}[/yellow]\n")

    # 对比
    if result.comparison:
        _print_comparison(result.comparison)


def _print_product(p, title: str):
    """打印单个 ProductResult"""
    stock_color = {"in_stock": "green", "out_of_stock": "red", "limited_stock": "yellow"}.get(
        p.stock.value if p.stock else "", "white"
    )
    grid = Table.grid(padding=(0, 1))
    grid.add_column(style="bold")
    grid.add_column()
    grid.add_row("标题", p.title or "—")
    grid.add_row("价格", f"{p.currency or ''} {p.price}" if p.price is not None else "—")
    grid.add_row("库存", f"[{stock_color}]{p.stock.value if p.stock else '?'}[/{stock_color}]")
    grid.add_row("卖家", p.seller or "—")
    grid.add_row("评分", f"⭐ {p.rating} ({p.review_count} 评论)" if p.rating else "—")
    grid.add_row("图片数", str(len(p.images)))
    grid.add_row("方法", p.fetch_method)
    if p.error:
        grid.add_row("错误", f"[red]{p.error}[/red]")
    console.print(Panel(grid, title=f"📦 {title}", border_style="cyan"))


def _print_comparison(comp):
    """打印对比结果"""
    score_color = "green" if comp.agreement_score >= 0.9 else "yellow" if comp.agreement_score >= 0.7 else "red"
    drift_color = {"none": "green", "minor": "yellow", "major": "red", "critical": "red bold"}.get(
        comp.drift_severity, "white"
    )

    grid = Table.grid(padding=(0, 1))
    grid.add_column(style="bold")
    grid.add_column()
    grid.add_row("一致度", f"[{score_color}]{comp.agreement_score:.1%}[/{score_color}]")
    grid.add_row("漂移检测", f"[{drift_color}]{comp.drift_severity}[/{drift_color}]")
    grid.add_row("本地源", comp.local_source)
    grid.add_row("Apify 源", comp.apify_source)

    console.print(Panel(grid, title="🔍 对比结果", border_style="magenta"))

    # 冲突表
    if comp.conflicts:
        table = Table(title="字段级冲突", box=box.SIMPLE)
        table.add_column("字段", style="cyan")
        table.add_column("本地", overflow="ellipsis", max_width=30)
        table.add_column("Apify", overflow="ellipsis", max_width=30)
        table.add_column("相似度", justify="right")
        table.add_column("严重度")
        table.add_column("处理")

        for c in comp.conflicts:
            if c.severity.value == "exact":
                continue
            sev_color = {"minor": "yellow", "major": "red", "incomparable": "white"}.get(c.severity.value, "white")
            table.add_row(
                c.field,
                str(c.local_value)[:30],
                str(c.apify_value)[:30],
                f"{c.similarity:.2f}",
                f"[{sev_color}]{c.severity.value}[/{sev_color}]",
                c.resolution.value,
            )
        console.print(table)

    # 推荐结果
    if comp.recommended:
        _print_product(comp.recommended, "🏆 推荐结果（综合）")


def _print_batch_summary(results):
    """打印批量结果汇总"""
    total = len(results)
    success = sum(1 for r in results if r.success)
    drift = sum(1 for r in results if r.comparison and r.comparison.drift_detected)
    avg_agreement = sum(
        r.comparison.agreement_score for r in results if r.comparison
    ) / max(1, sum(1 for r in results if r.comparison))

    console.print(f"\n[bold]📊 批量汇总[/bold]")
    console.print(f"  总数: {total}")
    console.print(f"  成功: [green]{success}[/green] / {total}")
    console.print(f"  漂移: [red]{drift}[/red] / {total}")
    console.print(f"  平均一致度: {avg_agreement:.1%}")


def main():
    """CLI 入口函数"""
    cli()


if __name__ == "__main__":
    main()
