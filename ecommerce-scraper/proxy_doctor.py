"""
代理质量检测 —— 抓取前自动跑，相当于 ping0.cc 的核心能力。

⚠️ ping0.cc 这种 IP 检测网站自身反爬也很严（Cloudflare + 动态 JS），
所以本工具**不抓 ping0.cc**，只查可靠的：

检测项：
1. 出口 IP（api.ipify.org —— 纯 HTTP，无反爬）
2. IP 类型 / ASN / 地理（ipapi.co —— 免费但有频率限制）
3. 黑名单（DNS 查询，不依赖 HTTP）
4. 目标平台连通性（直接请求 Amazon/Shopee/Lazada）
5. 响应延迟

⚠️ **每次启动程序时**会自动调 `prompt_manual_proxy_check()`，
**在系统默认浏览器开 4 个标签**（ipify、ping0、ip-api、whatismyip），
提示你**手动测一下**（Windows: Win+← / Win+→ 分屏到 1/4 屏看）。

用法:
    # 单独跑自动检测
    python proxy_doctor.py

    # 在代码里调用
    from proxy_doctor import diagnose, prompt_manual_proxy_check
    await prompt_manual_proxy_check()  # 启动时调，弹 4 个标签
    report = await diagnose()
    if report.healthy:
        await scrape(url)
"""
from __future__ import annotations

import asyncio
import socket
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional

import httpx

from scraper.config import settings
from scraper.logging import log


# =============================================================================
# 数据模型
# =============================================================================

@dataclass
class ProxyReport:
    """代理健康报告"""
    proxy_url: Optional[str]
    checked_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    # 1. 出口 IP
    exit_ip: Optional[str] = None
    exit_ip_error: Optional[str] = None

    # 2. IP 类型
    ip_type: Optional[str] = None  # "residential" / "datacenter" / "mobile" / "unknown"
    asn: Optional[str] = None
    asn_org: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    isp: Optional[str] = None
    ip_type_error: Optional[str] = None

    # 3. 黑名单（30+ DNSBL）
    blacklisted_on: list[str] = field(default_factory=list)
    blacklist_error: Optional[str] = None

    # 4. 目标平台测试
    target_tests: dict[str, dict] = field(default_factory=dict)
    # e.g. {"amazon": {"status": 200, "latency_ms": 850, "captcha": False, "error": None}}

    # 综合
    score: int = 0  # 0-100
    healthy: bool = False
    recommendation: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


# =============================================================================
# 1. 出口 IP 检测
# =============================================================================

async def _check_exit_ip(proxy_url: Optional[str], timeout: float = 10) -> tuple[Optional[str], Optional[str]]:
    """通过代理查出口 IP"""
    try:
        async with httpx.AsyncClient(proxy=proxy_url, timeout=timeout) as client:
            r = await client.get("https://api.ipify.org?format=json")
            r.raise_for_status()
            return r.json().get("ip"), None
    except Exception as e:
        return None, f"{type(e).__name__}: {e}"


# =============================================================================
# 2. IP 类型 / 地理 / ASN 检测（用 ipapi.co 免费接口）
# =============================================================================

async def _check_ip_info(ip: str, timeout: float = 15) -> dict:
    """查 IP 类型/ASN/地理位置"""
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.get(f"https://ipapi.co/{ip}/json/")
            if r.status_code == 200:
                d = r.json()
                # ipapi.co 的字段
                asn = d.get("asn", "")
                # 分类 ASN 类型（粗略）
                ip_type = "unknown"
                asn_lower = asn.lower()
                org_lower = d.get("org", "").lower()

                # 数据中心关键词（机房 IP）
                if any(x in asn_lower or x in org_lower for x in [
                    "google", "amazon", "microsoft", "digitalocean", "linode", "ovh",
                    "hetzner", "vultr", "scaleway", "oracle cloud", "alibaba cloud",
                    "tencent cloud", "huawei cloud", "azure", "cloudflare",
                ]):
                    ip_type = "datacenter"
                # 移动网络关键词
                elif any(x in org_lower for x in [
                    "mobile", "cellular", "wireless", "lte", "5g",
                    "t-mobile", "verizon wireless", "at&t mobility",
                ]):
                    ip_type = "mobile"
                # 住宅 / 家庭宽带关键词（ISP 名称）
                elif any(x in asn_lower or x in org_lower for x in [
                    "hinet", "chunghwa", "kddi", "ntt", "comcast", "verizon",
                    "at&t", "china telecom", "china unicom", "china mobile",
                    "data communication business group",  # 台湾 HiNet 旗下
                    "taiwan mobile", "fetnet", "so-net", "kbro",
                    "rogers", "bell canada", "telstra", "optus",
                    "deutsche telekom", "orange", "vodafone", "bt",
                    "jio", "airtel", "bharti",
                ]):
                    # 进一步确认不是云厂商的子网
                    if not any(x in asn_lower or x in org_lower for x in ["cloud", "hosting", "datacenter"]):
                        ip_type = "residential"
                return {
                    "ip_type": ip_type,
                    "asn": asn,
                    "asn_org": d.get("org", ""),
                    "country": d.get("country_name", ""),
                    "city": d.get("city", ""),
                    "isp": d.get("org", ""),
                }
            return {"error": f"http {r.status_code}"}
    except Exception as e:
        return {"error": f"{type(e).__name__}: {e}"}


# =============================================================================
# 3. 黑名单检查（DNSBL）
# =============================================================================

# 主流 DNSBL 列表（不全，仅常用）
DNSBL_LIST = [
    "zen.spamhaus.org",       # Spamhaus 最严
    "bl.spamcop.net",         # SpamCop
    "b.barracudacentral.org", # Barracuda
    "dnsbl.sorbs.net",        # SORBS
    "spam.dnsbl.sorbs.net",
    "cbl.abuseat.org",        # CBL
    "dnsbl-1.uceprotect.net", # UCEPROTECT
]


def _check_dnsbl(ip: str) -> tuple[list[str], Optional[str]]:
    """同步查 DNSBL（DNS 查询快，不上 async）"""
    if not ip:
        return [], "no ip"
    reversed_ip = ".".join(reversed(ip.split(".")))
    hits = []
    for bl in DNSBL_LIST:
        try:
            host = f"{reversed_ip}.{bl}"
            socket.gethostbyname(host)
            hits.append(bl)
        except socket.gaierror:
            pass  # 未在黑名单
        except Exception as e:
            return hits, f"{bl}: {e}"
    return hits, None


# =============================================================================
# 4. 目标平台连通性测试
# =============================================================================

TARGETS = [
    {"name": "amazon_us", "url": "https://www.amazon.com/", "captcha_marker": "Enter the characters you see below"},
    {"name": "amazon_jp", "url": "https://www.amazon.co.jp/", "captcha_marker": "Enter the characters you see below"},
    {"name": "shopee_sg", "url": "https://shopee.sg/", "captcha_marker": "captcha"},
    {"name": "lazada_my", "url": "https://www.lazada.com.my/", "captcha_marker": "captcha"},
    {"name": "tiktok_shop", "url": "https://shop.tiktok.com/", "captcha_marker": "captcha"},
]


async def _check_target(proxy_url: Optional[str], target: dict, timeout: float = 30) -> dict:
    """测试到目标平台的连通性"""
    result = {
        "name": target["name"],
        "url": target["url"],
        "status": None,
        "latency_ms": None,
        "captcha": False,
        "blocked": False,
        "error": None,
    }
    start = time.monotonic()
    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        }
        async with httpx.AsyncClient(
            proxy=proxy_url, timeout=timeout, follow_redirects=True, headers=headers,
        ) as client:
            r = await client.get(target["url"])
        result["latency_ms"] = int((time.monotonic() - start) * 1000)
        result["status"] = r.status_code

        # 状态码判断
        if r.status_code == 200:
            # 检查 CAPTCHA 标志
            html = r.text[:5000].lower()  # 只看前 5KB
            if target["captcha_marker"].lower() in html:
                result["captcha"] = True
        elif r.status_code in (403, 429, 503):
            result["blocked"] = True
    except Exception as e:
        result["error"] = f"{type(e).__name__}: {e}"
        result["latency_ms"] = int((time.monotonic() - start) * 1000)
    return result


# =============================================================================
# 5. 综合评分
# =============================================================================

def _compute_score(report: ProxyReport) -> tuple[int, str]:
    """计算综合分 0-100"""
    score = 0
    notes = []

    # 1. 出口 IP 可达 (20)
    if report.exit_ip:
        score += 20
    else:
        notes.append("出口 IP 不可达")
        return 0, " | ".join(notes) or "代理失败"

    # 2. IP 类型 (20)
    if report.ip_type == "residential":
        score += 20
        notes.append("住宅 IP (✓)")
    elif report.ip_type == "mobile":
        score += 15
        notes.append("移动 IP (良)")
    elif report.ip_type == "datacenter":
        score += 5
        notes.append("⚠️ 数据中心 IP（易被 CAPTCHA）")
    else:
        score += 8
        notes.append("IP 类型未知")

    # 3. 黑名单 (30)
    if not report.blacklisted_on:
        score += 30
        notes.append("无黑名单 (✓)")
    else:
        notes.append(f"⚠️ 在 {len(report.blacklisted_on)} 个黑名单: {report.blacklisted_on[:3]}")
        # 1-3 个 -10，4+ -25
        if len(report.blacklisted_on) <= 3:
            score += 20
        else:
            score += 5

    # 4. 目标平台 (30)
    tested = len(report.target_tests)
    if tested > 0:
        passed = sum(
            1 for t in report.target_tests.values()
            if t.get("status") == 200 and not t.get("captcha") and not t.get("blocked")
        )
        ratio = passed / tested
        score += int(30 * ratio)
        if ratio == 1:
            notes.append(f"所有 {tested} 平台可达 (✓)")
        elif ratio >= 0.5:
            notes.append(f"{passed}/{tested} 平台可达")
        else:
            notes.append(f"⚠️ 仅 {passed}/{tested} 平台可达")

    healthy = score >= 70
    return score, " | ".join(notes)


# =============================================================================
# 主入口
# =============================================================================

async def diagnose(
    proxy_url: Optional[str] = None,
    *,
    check_targets: bool = True,
    check_dnsbl: bool = True,
    targets: Optional[list[str]] = None,
) -> ProxyReport:
    """
    跑全套代理检测。

    Args:
        proxy_url: 代理 URL（None 用 settings.proxy_url）
        check_targets: 是否测试目标平台
        check_dnsbl: 是否查黑名单
        targets: 限制只测指定平台（None = 全测）
    """
    if proxy_url is None:
        proxy_url = settings.proxy_url

    report = ProxyReport(proxy_url=proxy_url)

    log.info(f"🔍 代理质量检测开始 (proxy={'已配置' if proxy_url else '直连'})")

    # === 1. 出口 IP ===
    log.info("  [1/4] 查出口 IP...")
    report.exit_ip, report.exit_ip_error = await _check_exit_ip(proxy_url)
    if report.exit_ip:
        log.info(f"    → {report.exit_ip}")
    else:
        log.error(f"    → 失败: {report.exit_ip_error}")
        # 直连也失败就提前返回
        report.score, report.recommendation = 0, "代理不可达，请检查 PROXY_URL"
        return report

    # === 2. IP 类型 ===
    log.info("  [2/4] 查 IP 类型 / ASN / 地理...")
    info = await _check_ip_info(report.exit_ip)
    if "error" not in info:
        report.ip_type = info.get("ip_type")
        report.asn = info.get("asn")
        report.asn_org = info.get("asn_org")
        report.country = info.get("country")
        report.city = info.get("city")
        report.isp = info.get("isp")
        log.info(f"    → {report.ip_type} | {report.country} {report.city} | {report.asn_org}")
    else:
        report.ip_type_error = info["error"]
        log.warning(f"    → 失败: {info['error']}")

    # === 3. 黑名单 ===
    if check_dnsbl:
        log.info(f"  [3/4] 查 DNSBL 黑名单 ({len(DNSBL_LIST)} 个源)...")
        # DNS 查是同步，放到线程池
        hits, err = await asyncio.get_event_loop().run_in_executor(
            None, _check_dnsbl, report.exit_ip
        )
        report.blacklisted_on = hits
        report.blacklist_error = err
        if hits:
            log.warning(f"    → ⚠️ 在 {len(hits)} 个黑名单: {hits}")
        else:
            log.info(f"    → 无黑名单 (✓)")

    # === 4. 目标平台 ===
    if check_targets:
        target_list = TARGETS
        if targets:
            target_list = [t for t in TARGETS if t["name"] in targets]
        log.info(f"  [4/4] 测目标平台 ({len(target_list)} 个)...")
        # 并行
        tasks = [_check_target(proxy_url, t) for t in target_list]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for r in results:
            if isinstance(r, Exception):
                continue
            report.target_tests[r["name"]] = r
            status = "✓" if r.get("status") == 200 and not r.get("captcha") else "✗"
            extra = ""
            if r.get("captcha"):
                extra = " [CAPTCHA]"
            elif r.get("blocked"):
                extra = " [BLOCKED]"
            elif r.get("status"):
                extra = f" {r['status']}"
            log.info(f"    {status} {r['name']:15s} {r.get('latency_ms', 0):5d}ms{extra}")

    # === 综合 ===
    report.score, report.recommendation = _compute_score(report)
    report.healthy = report.score >= 70

    log.info(f"\n  📊 综合分: {report.score}/100  {'✅ 健康' if report.healthy else '⚠️ 质量差'}")
    log.info(f"  💡 {report.recommendation}")

    return report


# =============================================================================
# 6. 手动测试提醒（启动程序时调）
# =============================================================================

# 这 4 个 URL 设计目的：
# - 1/4 屏 4 个标签 = 你的机器上 1/4 屏 × 4 = 整屏布局
# - 浏览器默认主页开在右上 / 左下 / 右下 三屏也行
# - 用户用 Win+← / Win+→ 自己分屏
MANUAL_CHECK_URLS = [
    ("🌐 api.ipify.org",       "https://api.ipify.org?format=json",          "看纯出口 IP（最快最准）"),
    ("🇹🇼 ping0.cc",          "https://ping0.cc/",                           "完整报告（IP 类型 / 纯净度 / 评分）"),
    ("🗺️ ip-api.com",          "http://ip-api.com/json/",                     "IP 归属地 / ASN / 运营商（无频率限制）"),
    ("🔍 whatismyip",         "https://whatismyipaddress.com/",             "国外视点的 IP 显示"),
]


def prompt_manual_proxy_check(
    urls: list[tuple[str, str, str]] = None,
    *,
    show_in_console: bool = True,
) -> None:
    """
    启动时弹窗：开 4 个浏览器标签提醒手动测试代理质量。

    不阻塞程序，**异步**打开。
    Windows 提示用户用 Win+←/→ 把窗口分到 1/4 屏看。

    Args:
        urls: 自定义 URL 列表（None 用默认 4 个）
        show_in_console: 是否在终端打印分屏说明
    """
    import subprocess
    import sys
    import webbrowser

    urls = urls or MANUAL_CHECK_URLS

    # 1. 终端打印
    if show_in_console:
        print("\n" + "=" * 70)
        print("  🩺  代理质量手动测试提醒")
        print("=" * 70)
        print("\n  正在打开 4 个浏览器标签，请用以下快捷键分到 1/4 屏查看：")
        print()
        print("    Windows:  Win + ←  /  Win + →     （左右各占 1/2）")
        print("              然后 Win + ↑  /  Win + ↓  （再分上下 1/2）")
        print("    macOS:    鼠标拖到屏幕左/右边角（Split View）")
        print("              然后用第三方工具（如 Rectangle）继续分屏")
        print()
        print("  4 个标签用途：")
        for i, (label, url, desc) in enumerate(urls, 1):
            print(f"    {i}. {label}")
            print(f"       {url}")
            print(f"       → {desc}")
        print()
        print("  ⏳ 10 秒后继续（或按 Enter 立即继续）...")
        print("=" * 70 + "\n")

    # 2. 开 4 个标签（异步，不阻塞）
    opened = 0
    try:
        for label, url, _desc in urls:
            # 用 webbrowser（系统默认浏览器）
            if webbrowser.open(url, new=2):  # new=2 = 新标签
                opened += 1
            else:
                # 备选：subprocess 直接调
                import os
                if sys.platform == "darwin":  # macOS
                    subprocess.Popen(["open", url])
                elif sys.platform.startswith("win"):  # Windows
                    os.startfile(url)  # type: ignore
                else:  # Linux
                    subprocess.Popen(["xdg-open", url])
                opened += 1
    except Exception as e:
        log.warning(f"自动开浏览器失败: {e}")
        # 退化：把 URL 打印出来让用户自己复制
        print("  ⚠️ 浏览器开不起来，请手动复制以下 URL：")
        for label, url, _desc in urls:
            print(f"    {label}: {url}")
        return

    log.info(f"🌐 已开 {opened} 个浏览器标签")


# =============================================================================
# CLI
# =============================================================================

def main():
    import argparse
    import json
    import os
    from scraper.logging import setup_logging

    setup_logging()
    parser = argparse.ArgumentParser(description="代理质量检测")
    parser.add_argument("--proxy", default=None, help="代理 URL（覆盖 .env）")
    parser.add_argument("--no-targets", action="store_true", help="跳过目标平台测试")
    parser.add_argument("--no-dnsbl", action="store_true", help="跳过黑名单检查")
    parser.add_argument("--targets", nargs="*", help="只测指定平台（amazon_us/shopee_sg ...）")
    parser.add_argument("--json", action="store_true", help="JSON 输出")
    parser.add_argument("--output", "-o", default=None, help="保存到文件")
    parser.add_argument("--manual-check", action="store_true",
                        help="启动时弹 4 个浏览器标签提醒手动测试代理")
    parser.add_argument("--no-manual-check", action="store_true", help="不弹手动测试提醒")
    args = parser.parse_args()

    # 弹窗提醒（默认开）
    if args.manual_check or (not args.no_manual_check):
        prompt_manual_proxy_check()

    proxy = args.proxy or os.getenv("PROXY_URL")

    report = asyncio.run(diagnose(
        proxy_url=proxy,
        check_targets=not args.no_targets,
        check_dnsbl=not args.no_dnsbl,
        targets=args.targets,
    ))

    if args.json:
        out = json.dumps(report.to_dict(), ensure_ascii=False, indent=2)
        if args.output:
            Path(args.output).write_text(out, encoding="utf-8")
            print(f"✅ 已写入 {args.output}")
        else:
            print(out)
    else:
        # 漂亮打印
        _print_pretty(report)


def _print_pretty(r: ProxyReport):
    print(f"\n{'=' * 60}")
    print(f"  🔍 代理质量检测报告")
    print(f"{'=' * 60}")
    print(f"  检测时间: {r.checked_at}")
    print(f"  代理 URL: {r.proxy_url or '(直连)'}")

    print(f"\n  📍 出口 IP")
    if r.exit_ip:
        print(f"    IP:        {r.exit_ip}")
        if r.ip_type:
            print(f"    类型:      {_emoji(r.ip_type)} {r.ip_type}")
        if r.country:
            print(f"    地理:      {r.country} {r.city}")
        if r.asn:
            print(f"    ASN:       {r.asn}")
        if r.asn_org:
            print(f"    组织:      {r.asn_org}")
    else:
        print(f"    ❌ 失败: {r.exit_ip_error}")

    print(f"\n  🚫 黑名单（{len(DNSBL_LIST)} 个 DNSBL 源）")
    if r.blacklisted_on:
        print(f"    ⚠️ 在 {len(r.blacklisted_on)} 个黑名单:")
        for bl in r.blacklisted_on:
            print(f"      - {bl}")
    else:
        print(f"    ✅ 干净")

    print(f"\n  🎯 目标平台")
    for name, t in r.target_tests.items():
        if t.get("status") == 200 and not t.get("captcha"):
            mark = "✅"
        elif t.get("captcha"):
            mark = "⚠️"
        elif t.get("blocked"):
            mark = "🚫"
        else:
            mark = "❌"
        lat = t.get("latency_ms", 0)
        status = t.get("status", "—")
        print(f"    {mark} {name:15s} {status}  {lat}ms")

    print(f"\n  📊 综合分: {r.score}/100")
    if r.healthy:
        print(f"  ✅ 代理健康，建议使用")
    else:
        print(f"  ⚠️ 代理质量差，建议更换")
    print(f"  💡 {r.recommendation}")
    print(f"{'=' * 60}\n")


def _emoji(ip_type: str) -> str:
    return {
        "residential": "🏠",
        "datacenter": "🏢",
        "mobile": "📱",
        "unknown": "❓",
    }.get(ip_type, "❓")


if __name__ == "__main__":
    main()
