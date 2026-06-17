"""
双轨抓取结果可视化对比 —— 生成独立 HTML 页面，左右两栏展示 local vs apify。

用法:
    # 方式 1: 直接抓 + 渲染
    python compare_view.py "https://www.amazon.com/dp/B08N5WRWNW"

    # 方式 2: 从已有 JSON / JSONL 读
    python compare_view.py --from results.jsonl --index 0
    python compare_view.py --from result.json

    # 方式 3: 离线 mock（不抓网络）
    python compare_view.py --mock

    # 启动后浏览器打开
    python -m http.server 8000  # 启静态服务
    浏览器访问 http://127.0.0.1:8000/compare_view.html
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path

from scraper import scrape
from scraper.comparator import Comparator
from scraper.platforms import Platform, detect_platform
from scraper.result import ProductResult, Source, StockStatus


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>ecommerce-scraper · 双轨对比</title>
<style>
  :root {{
    --bg: #0f1115;
    --panel: #181b22;
    --panel-2: #1f232c;
    --border: #2a2f3a;
    --text: #e6e8eb;
    --dim: #8b93a1;
    --green: #34d399;
    --yellow: #fbbf24;
    --red: #f87171;
    --accent: #60a5fa;
  }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0; padding: 24px;
    background: var(--bg); color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
                 "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    line-height: 1.6;
  }}
  .header {{
    max-width: 1400px; margin: 0 auto 20px;
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 20px;
    background: var(--panel); border: 1px solid var(--border);
    border-radius: 12px;
  }}
  .header h1 {{ margin: 0; font-size: 18px; font-weight: 600; }}
  .header .meta {{ color: var(--dim); font-size: 13px; }}
  .summary {{
    max-width: 1400px; margin: 0 auto 20px;
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  }}
  .stat {{
    padding: 14px 18px;
    background: var(--panel); border: 1px solid var(--border);
    border-radius: 10px;
  }}
  .stat .label {{ color: var(--dim); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }}
  .stat .value {{ font-size: 22px; font-weight: 700; margin-top: 4px; }}
  .stat.green .value {{ color: var(--green); }}
  .stat.yellow .value {{ color: var(--yellow); }}
  .stat.red .value {{ color: var(--red); }}
  .stat.blue .value {{ color: var(--accent); }}
  .container {{
    max-width: 1400px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  }}
  .panel {{
    background: var(--panel); border: 1px solid var(--border);
    border-radius: 12px; overflow: hidden;
  }}
  .panel-header {{
    padding: 12px 18px;
    background: var(--panel-2);
    border-bottom: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: center;
  }}
  .panel-header h2 {{ margin: 0; font-size: 14px; font-weight: 600; }}
  .badge {{
    padding: 2px 8px; border-radius: 4px;
    font-size: 11px; font-weight: 600;
    background: var(--border); color: var(--dim);
  }}
  .badge.local {{ background: #1e3a5f; color: var(--accent); }}
  .badge.apify {{ background: #4a2c4a; color: #d8a0d8; }}
  .badge.ok    {{ background: #0f3a2c; color: var(--green); }}
  .badge.warn  {{ background: #3a2f0f; color: var(--yellow); }}
  .badge.err   {{ background: #3a0f0f; color: var(--red); }}
  .row {{
    display: grid; grid-template-columns: 110px 1fr;
    padding: 10px 18px;
    border-bottom: 1px solid var(--border);
    font-size: 14px;
  }}
  .row:last-child {{ border-bottom: none; }}
  .row .k {{ color: var(--dim); font-size: 12px; }}
  .row .v {{ color: var(--text); word-break: break-word; }}
  .row.diff-exact    {{ background: rgba(52, 211, 153, 0.04); }}
  .row.diff-minor    {{ background: rgba(251, 191, 36, 0.08); }}
  .row.diff-major    {{ background: rgba(248, 113, 113, 0.10); }}
  .row.diff-incomparable {{ background: rgba(139, 147, 161, 0.10); }}
  .row .v-tag {{
    display: inline-block; margin-left: 6px;
    padding: 1px 6px; border-radius: 3px;
    font-size: 10px; font-weight: 600;
  }}
  .v-tag.minor {{ background: rgba(251, 191, 36, 0.2); color: var(--yellow); }}
  .v-tag.major {{ background: rgba(248, 113, 113, 0.2); color: var(--red); }}
  .v-tag.incomparable {{ background: var(--border); color: var(--dim); }}
  .v-tag.exact {{ background: rgba(52, 211, 153, 0.2); color: var(--green); }}
  .error-row {{ color: var(--red); padding: 14px 18px; font-family: monospace; font-size: 12px; }}
  .specs {{ font-size: 12px; color: var(--dim); white-space: pre-wrap; }}
  .footer {{
    max-width: 1400px; margin: 20px auto 0;
    padding: 12px 18px;
    background: var(--panel); border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--dim); font-size: 12px; text-align: center;
  }}
  .recommended {{
    max-width: 1400px; margin: 20px auto 0;
    padding: 16px 20px;
    background: linear-gradient(135deg, #1a2440, #1f1830);
    border: 1px solid var(--border);
    border-radius: 12px;
  }}
  .recommended h2 {{ margin: 0 0 10px; font-size: 14px; color: var(--accent); }}
  .recommended-grid {{
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
  }}
  .recommended-grid div {{ font-size: 13px; }}
  .recommended-grid strong {{ color: var(--dim); display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }}
  .conflicts {{
    max-width: 1400px; margin: 20px auto 0;
    background: var(--panel); border: 1px solid var(--border);
    border-radius: 12px; overflow: hidden;
  }}
  .conflicts table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
  .conflicts th, .conflicts td {{
    text-align: left; padding: 10px 14px;
    border-bottom: 1px solid var(--border);
  }}
  .conflicts th {{ background: var(--panel-2); color: var(--dim); font-weight: 500; font-size: 12px; text-transform: uppercase; }}
  .conflicts tr:last-child td {{ border-bottom: none; }}
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>🛒 {platform} · 双轨制抓取对比</h1>
    <div class="meta">URL: <a href="{url}" style="color:var(--accent);">{url}</a></div>
  </div>
  <div class="meta">{timestamp}</div>
</div>

<div class="summary">
  <div class="stat {agreement_class}">
    <div class="label">一致度</div>
    <div class="value">{agreement_pct}</div>
  </div>
  <div class="stat {drift_class}">
    <div class="label">漂移等级</div>
    <div class="value">{drift}</div>
  </div>
  <div class="stat blue">
    <div class="label">冲突字段</div>
    <div class="value">{conflict_count}</div>
  </div>
  <div class="stat {status_class}">
    <div class="label">抓取状态</div>
    <div class="value">{status}</div>
  </div>
</div>

<div class="container">
  <div class="panel">
    <div class="panel-header">
      <h2>📍 本地引擎 (LocalFetcher)</h2>
      <span class="badge {local_badge}">{local_status}</span>
    </div>
    {local_rows}
  </div>

  <div class="panel">
    <div class="panel-header">
      <h2>☁️  Apify 云端</h2>
      <span class="badge {apify_badge}">{apify_status}</span>
    </div>
    {apify_rows}
  </div>
</div>

<div class="recommended">
  <h2>🏆 推荐结果（综合）</h2>
  <div class="recommended-grid">
    <div><strong>标题</strong>{rec_title}</div>
    <div><strong>价格</strong>{rec_price}</div>
    <div><strong>库存</strong>{rec_stock}</div>
    <div><strong>卖家</strong>{rec_seller}</div>
    <div><strong>评分</strong>{rec_rating}</div>
    <div><strong>方法</strong>{rec_method}</div>
  </div>
</div>

{conflicts_html}

<div class="footer">
  ecommerce-scraper v0.1.0 · 本地 {local_duration} · 渲染耗时 {render_ms}ms
</div>

</body>
</html>
"""


# =============================================================================
# 数据准备
# =============================================================================

def make_mock_data() -> dict:
    """Mock 数据（无网络）"""
    url = "https://www.amazon.com/dp/B08N5WRWNW"
    local = ProductResult(
        url=url, source=Source.LOCAL,
        fetched_at=datetime.utcnow().isoformat(),
        title="Echo Dot (4th Gen, 2020 release) | Smart speaker with Alexa",
        price=49.99, currency="USD", stock=StockStatus.IN_STOCK,
        description="Meet Echo Dot - Our most popular smart speaker with fabric design. Ideal for bedside table or kitchen counter.",
        seller="Amazon Renewed",
        rating=4.7, review_count=12345,
        images=["https://m.media-amazon.com/images/I/61R5j2x1j3L._AC_SL1000_.jpg"],
        confidence=0.85, fetch_method="undetected-playwright:stealth",
        specs={"Brand": "Amazon", "Model": "Echo Dot 4th Gen", "Color": "Charcoal"},
    )
    apify = ProductResult(
        url=url, source=Source.APIFY,
        fetched_at=datetime.utcnow().isoformat(),
        title="Echo Dot (4th Gen, 2020 release) | Smart speaker with Alexa (Renewed)",  # 略不同
        price=49.98, currency="USD", stock=StockStatus.IN_STOCK,  # 差 $0.01
        description="Meet Echo Dot - Our most popular smart speaker with fabric design.",
        seller="Amazon",
        rating=4.7, review_count=12350,  # 差 5
        images=["https://m.media-amazon.com/images/I/61R5j2x1j3L._AC_SL1000_.jpg"],
        confidence=0.95, fetch_method="apify:apify/amazon-product-scraper",
        specs={"Brand": "Amazon", "Model": "Echo Dot 4th Gen", "Color": "Twilight Blue"},  # 颜色不同
    )
    comp = Comparator().compare(local, apify)
    return {
        "url": url,
        "platform": "Amazon",
        "local": local,
        "apify": apify,
        "comparison": comp,
        "local_duration_ms": 1200,
        "render_ms": 50,
    }


def load_from_file(path: Path, index: int = 0) -> dict:
    """从 JSON/JSONL 加载（cli.py batch 的输出格式）"""
    text = path.read_text(encoding="utf-8")
    if path.suffix == ".jsonl":
        lines = [l for l in text.splitlines() if l.strip()]
        data = json.loads(lines[index])
    else:
        data = json.loads(text)

    # 重构对象
    platform = detect_platform(data["url"])
    local = ProductResult(**data.get("local", {})) if data.get("local") else None
    apify = ProductResult(**data.get("apify", {})) if data.get("apify") else None
    if data.get("comparison") and local and apify:
        comp = Comparator().compare(local, apify)
    else:
        comp = None
    return {
        "url": data["url"],
        "platform": platform.display_name if platform else "Unknown",
        "local": local,
        "apify": apify,
        "comparison": comp,
        "local_duration_ms": data.get("total_duration_ms", 0),
        "render_ms": 0,
    }


async def fetch_and_compare(url: str) -> dict:
    """真实抓取 + 对比"""
    start = datetime.utcnow()
    result = await scrape(url)
    platform = detect_platform(url)
    return {
        "url": url,
        "platform": platform.display_name if platform else "Unknown",
        "local": result.local,
        "apify": result.apify,
        "comparison": result.comparison,
        "local_duration_ms": result.total_duration_ms,
        "render_ms": int((datetime.utcnow() - start).total_seconds() * 1000),
    }


# =============================================================================
# 渲染
# =============================================================================

FIELDS = [
    ("title", "标题", lambda p: p.title),
    ("price", "价格", lambda p: f"{p.currency or ''} {p.price}" if p.price is not None else "—"),
    ("stock", "库存", lambda p: p.stock.value if p.stock else "—"),
    ("seller", "卖家", lambda p: p.seller),
    ("rating", "评分", lambda p: f"⭐ {p.rating}" if p.rating else "—"),
    ("review_count", "评论数", lambda p: p.review_count),
    ("description", "描述", lambda p: (p.description[:120] + "…") if p.description and len(p.description) > 120 else p.description),
    ("image_count", "图片数", lambda p: len(p.images)),
    ("fetch_method", "方法", lambda p: p.fetch_method),
    ("confidence", "置信度", lambda p: f"{p.confidence:.0%}" if p.confidence is not None else "—"),
    ("specs", "规格", lambda p: "\n".join(f"{k}: {v}" for k, v in (p.specs or {}).items())[:200]),
]


def _class_of(severity: str) -> str:
    return f"diff-{severity}" if severity in ("exact", "minor", "major", "incomparable") else ""


def _tag_html(severity: str) -> str:
    if not severity:
        return ""
    return f'<span class="v-tag {severity}">{severity}</span>'


def render_html(data: dict) -> str:
    """渲染 HTML"""
    local = data.get("local")
    apify = data.get("apify")
    comp = data.get("comparison")
    url = data["url"]
    platform = data["platform"]

    # 提取每个字段的严重度（从 comp.conflicts）
    severity_map: dict[str, str] = {}
    if comp:
        for c in comp.conflicts:
            severity_map[c.field] = c.severity.value

    # 一致度统计
    if comp:
        agreement = comp.agreement_score
        drift = comp.drift_severity
        conflict_count = sum(1 for c in comp.conflicts if c.severity.value != "exact")
        recommended = comp.recommended
    else:
        agreement = 0
        drift = "n/a"
        conflict_count = 0
        recommended = local or apify

    # 状态徽章
    def badge_for(p: ProductResult | None) -> tuple[str, str]:
        if p is None:
            return "warn", "no data"
        if p.error:
            return "err", "error"
        if not p.is_complete:
            return "warn", "partial"
        return "ok", "ok"

    local_badge, local_status = badge_for(local)
    apify_badge, apify_status = badge_for(apify)

    # 渲染行
    def render_rows(p: ProductResult | None) -> str:
        if p is None:
            return '<div class="error-row">未抓取到数据</div>'
        if p.error:
            return f'<div class="error-row">{p.error}</div>'
        rows = []
        for key, label, fn in FIELDS:
            val = fn(p) or "—"
            sev = severity_map.get(key)
            cls = _class_of(sev) if sev and sev != "exact" else ""
            tag = _tag_html(sev) if sev and sev != "exact" else ""
            rows.append(
                f'<div class="row {cls}">'
                f'<div class="k">{label}{tag}</div>'
                f'<div class="v">{val}</div>'
                f'</div>'
            )
        return "\n".join(rows)

    # 冲突表
    conflicts_html = ""
    if comp and comp.conflicts:
        conflict_rows = []
        for c in comp.conflicts:
            if c.severity.value == "exact":
                continue
            conflict_rows.append(
                f"<tr>"
                f'<td><code>{c.field}</code></td>'
                f'<td>{str(c.local_value)[:60]}</td>'
                f'<td>{str(c.apify_value)[:60]}</td>'
                f'<td><span class="v-tag {c.severity.value}">{c.severity.value}</span></td>'
                f'<td>{c.similarity:.2f}</td>'
                f'<td>{c.resolution.value}</td>'
                f"</tr>"
            )
        if conflict_rows:
            conflicts_html = f"""
<div class="conflicts">
  <table>
    <thead>
      <tr>
        <th>字段</th><th>本地</th><th>Apify</th><th>严重度</th><th>相似度</th><th>处理</th>
      </tr>
    </thead>
    <tbody>
      {"".join(conflict_rows)}
    </tbody>
  </table>
</div>"""

    agreement_pct = f"{agreement:.1%}" if agreement else "—"
    agreement_class = "green" if agreement >= 0.9 else "yellow" if agreement >= 0.7 else "red"
    drift_class = {"none": "green", "minor": "yellow", "major": "red"}.get(drift, "blue")
    status_class = "green" if (local and not local.error) or (apify and not apify.error) else "red"
    status = "✅ 成功" if status_class == "green" else "❌ 失败"

    return HTML_TEMPLATE.format(
        platform=platform,
        url=url,
        timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        agreement_pct=agreement_pct,
        agreement_class=agreement_class,
        drift=drift,
        drift_class=drift_class,
        conflict_count=conflict_count,
        status=status,
        status_class=status_class,
        local_badge=local_badge,
        local_status=local_status,
        apify_badge=apify_badge,
        apify_status=apify_status,
        local_rows=render_rows(local),
        apify_rows=render_rows(apify),
        rec_title=recommended.title if recommended else "—",
        rec_price=f"{recommended.currency or ''} {recommended.price}" if recommended and recommended.price else "—",
        rec_stock=recommended.stock.value if recommended and recommended.stock else "—",
        rec_seller=recommended.seller if recommended else "—",
        rec_rating=f"⭐ {recommended.rating} ({recommended.review_count})" if recommended and recommended.rating else "—",
        rec_method=recommended.fetch_method if recommended else "—",
        conflicts_html=conflicts_html,
        local_duration=f"{data.get('local_duration_ms', 0)}ms",
        render_ms=data.get("render_ms", 0),
    )


# =============================================================================
# CLI
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="生成双轨抓取对比 HTML 页面")
    parser.add_argument("url", nargs="?", help="商品 URL")
    parser.add_argument("--from", dest="from_file", help="从 JSON/JSONL 加载")
    parser.add_argument("--index", type=int, default=0, help="JSONL 中的索引")
    parser.add_argument("--mock", action="store_true", help="用 mock 数据（不抓网络）")
    parser.add_argument("--output", "-o", default="compare_view.html", help="输出文件")
    parser.add_argument("--no-proxy-check", action="store_true",
                        help="跳过启动时弹 4 个标签提醒手动测代理")
    args = parser.parse_args()

    # 启动时弹 4 个标签提醒手动测代理（mock 模式除外）
    if not args.no_proxy_check and not args.mock:
        from proxy_doctor import prompt_manual_proxy_check
        prompt_manual_proxy_check()

    if args.mock:
        data = make_mock_data()
    elif args.from_file:
        data = load_from_file(Path(args.from_file), args.index)
    elif args.url:
        data = asyncio.run(fetch_and_compare(args.url))
    else:
        parser.print_help()
        print("\n💡 试试 --mock 不抓网络看效果:")
        print("   python compare_view.py --mock")
        sys.exit(1)

    html = render_html(data)
    out = Path(args.output)
    out.write_text(html, encoding="utf-8")
    print(f"✅ 已生成 {out.resolve()}")
    print(f"   浏览器打开: file://{out.resolve()}")


if __name__ == "__main__":
    main()
