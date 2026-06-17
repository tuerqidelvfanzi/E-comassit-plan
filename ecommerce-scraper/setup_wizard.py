"""
配置向导 —— 交互式生成 .env，免手写。

用法:
    python setup_wizard.py

特性:
- 一步一步问，按回车用默认值
- 凭据字段全部用 getpass（不显示明文）
- 自动写入 .env（保留已有值）
- 写入后跑一次连通性测试（可选）
"""
from __future__ import annotations

import getpass
import os
import shutil
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
ENV_FILE = PROJECT_ROOT / ".env"
ENV_EXAMPLE = PROJECT_ROOT / ".env.example"


# ANSI 颜色
def c(code: int) -> str: return f"\033[{code}m"
GREEN = c(92); YELLOW = c(93); RED = c(91); CYAN = c(96); BOLD = c(1); DIM = c(2); END = c(0)


def banner():
    print(f"""
{CYAN}╔══════════════════════════════════════════════════════════════╗
║   {BOLD}ecommerce-scraper  v0.1.0  配置向导{END}{CYAN}                            ║
║   交互式生成 .env 配置，免手写                                 ║
╚══════════════════════════════════════════════════════════════╝{END}
""")


def section(title: str):
    print(f"\n{CYAN}{BOLD}━━━ {title} ━━━{END}")


def ask(label: str, default: str = "", *, secret: bool = False, optional: bool = True) -> str:
    """
    询问用户输入。
    - secret=True: 密码输入（不显示明文）
    - optional=True: 留空跳过（用于非必填项）
    """
    hint = f" [{DIM}留空跳过{END}]" if optional else f" [{RED}必填{END}]"
    if default:
        prompt = f"  {label}{DIM} (默认: {default}){END}: "
    else:
        prompt = f"  {label}{hint}: "
    try:
        if secret:
            val = getpass.getpass(prompt)
        else:
            val = input(prompt)
    except (KeyboardInterrupt, EOFError):
        print(f"\n{YELLOW}已取消{END}")
        sys.exit(1)
    val = val.strip()
    if not val and default:
        return default
    return val


def yesno(label: str, default: bool = True) -> bool:
    suffix = "Y/n" if default else "y/N"
    val = input(f"  {label} [{suffix}]: ").strip().lower()
    if not val:
        return default
    return val in ("y", "yes", "是")


def load_existing() -> dict:
    """读现有 .env（如有）"""
    if not ENV_FILE.exists():
        return {}
    env = {}
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip()
    return env


def parse_env_example() -> list[tuple[str, str, bool]]:
    """从 .env.example 解析 (key, comment, is_required_for_wizard)"""
    if not ENV_EXAMPLE.exists():
        return []
    lines = ENV_EXAMPLE.read_text(encoding="utf-8").splitlines()
    parsed = []
    current_comment = ""
    for line in lines:
        s = line.strip()
        if s.startswith("#"):
            current_comment = s.lstrip("# ").strip()
        elif "=" in s and not s.startswith("#"):
            k, _ = s.split("=", 1)
            parsed.append((k.strip(), current_comment, False))
            current_comment = ""
    return parsed


def write_env(values: dict) -> None:
    """把 values 合并写回 .env（保留注释和未触碰的字段）"""
    if ENV_EXAMPLE.exists():
        lines = ENV_EXAMPLE.read_text(encoding="utf-8").splitlines()
        new_lines = []
        for line in lines:
            s = line.strip()
            if s.startswith("#") or not s or "=" not in s:
                new_lines.append(line)
                continue
            k, _v = s.split("=", 1)
            k = k.strip()
            if k in values and values[k]:
                new_lines.append(f"{k}={values[k]}")
            else:
                new_lines.append(line)
        ENV_FILE.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
    else:
        # 没有 .env.example，手写
        ENV_FILE.write_text(
            "\n".join(f"{k}={v}" for k, v in values.items() if v) + "\n",
            encoding="utf-8",
        )


def test_proxy(proxy_url: str) -> tuple[bool, str]:
    """测代理连通性，返回 (ok, info)"""
    try:
        import httpx
        with httpx.Client(proxy=proxy_url, timeout=10) as c:
            r = c.get("https://api.ipify.org?format=json")
        if r.status_code == 200:
            return True, f"出口 IP: {r.json().get('ip', '?')}"
    except Exception as e:
        return False, str(e)
    return False, f"HTTP {r.status_code}"


def test_apify(token: str) -> tuple[bool, str]:
    """测 Apify token"""
    try:
        from apify_client import ApifyClient
        c = ApifyClient(token=token)
        me = c.user().get()
        return True, f"账号: {me.get('username', '?')}"
    except Exception as e:
        return False, str(e)


def test_openai(key: str) -> tuple[bool, str]:
    """测 OpenAI key（不调 LLM，只列模型）"""
    try:
        import httpx
        r = httpx.get(
            "https://api.openai.com/v1/models",
            headers={"Authorization": f"Bearer {key}"},
            timeout=10,
        )
        if r.status_code == 200:
            return True, f"模型数: {len(r.json().get('data', []))}"
        return False, f"HTTP {r.status_code}"
    except Exception as e:
        return False, str(e)


# =============================================================================
# 主流程
# =============================================================================

def main():
    banner()

    # 启动时弹 4 个标签提醒手动测代理
    from proxy_doctor import prompt_manual_proxy_check
    prompt_manual_proxy_check()

    # 检测现有 .env
    if ENV_FILE.exists():
        print(f"{YELLOW}⚠️  已存在 .env{END}")
        if not yesno("覆盖现有配置？", default=False):
            print(f"{CYAN}已保留现有 .env{END}")
        else:
            shutil.copy(ENV_FILE, ENV_FILE.with_suffix(".env.bak"))
            print(f"  备份 → {ENV_FILE.with_suffix('.env.bak')}")
    else:
        if not yesno("将在当前目录创建 .env，确认？", default=True):
            sys.exit(0)

    existing = load_existing()
    new_values: dict[str, str] = {}

    # === 1. 代理 ===
    section("1/6  住宅代理（推荐配置 —— 防 Amazon CAPTCHA）")
    print(f"  {DIM}格式: http://user:pass@host:port")
    print(f"  示例: http://127.0.0.1:7890（本地 Clash）{END}")
    proxy = ask("PROXY_URL", default=existing.get("PROXY_URL", ""))
    if proxy:
        new_values["PROXY_URL"] = proxy
        print(f"  {CYAN}测试代理连通性...{END}")
        ok, info = test_proxy(proxy)
        if ok:
            print(f"  {GREEN}✅ 代理可用 → {info}{END}")
        else:
            print(f"  {RED}❌ 代理不可用: {info}{END}")
            if not yesno("保留这个代理配置吗？", default=False):
                new_values.pop("PROXY_URL", None)

    # === 2. Apify ===
    section("2/6  Apify token（开启双轨对比轨）")
    print(f"  {DIM}申请: https://console.apify.com/account/integrations{END}")
    apify = ask("APIFY_TOKEN", default=existing.get("APIFY_TOKEN", ""), secret=True)
    if apify:
        new_values["APIFY_TOKEN"] = apify
        print(f"  {CYAN}测试 Apify token...{END}")
        ok, info = test_apify(apify)
        if ok:
            print(f"  {GREEN}✅ Apify 可用 → {info}{END}")
        else:
            print(f"  {RED}❌ Apify 不可用: {info}{END}")
            if not yesno("保留这个 token 吗？", default=False):
                new_values.pop("APIFY_TOKEN", None)

    # === 3. OpenAI ===
    section("3/6  OpenAI key（可选，LLM 提取/翻译）")
    print(f"  {DIM}申请: https://platform.openai.com/api-keys{END}")
    openai = ask("OPENAI_API_KEY", default=existing.get("OPENAI_API_KEY", ""), secret=True)
    if openai:
        new_values["OPENAI_API_KEY"] = openai
        print(f"  {CYAN}测试 OpenAI key...{END}")
        ok, info = test_openai(openai)
        if ok:
            print(f"  {GREEN}✅ OpenAI 可用 → {info}{END}")
        else:
            print(f"  {YELLOW}⚠️  OpenAI 测试失败: {info}（可能是网络问题）{END}")

    # === 4-6. 中国商家 API ===
    section("4/6  中国电商商家 API 凭据（自己店铺才用）")
    print(f"  {DIM}抓竞品严禁系统化爬取，请用 Apify 第三方服务{END}")
    print(f"  {DIM}自己店铺数据请走开放平台：{END}")
    print(f"  {DIM}  淘宝: https://open.taobao.com{END}")
    print(f"  {DIM}  京东: https://open.jd.com{END}")
    print(f"  {DIM}  抖店: https://op.jinritemai.com{END}")
    print(f"  {DIM}  拼多多: https://open.pinduoduo.com{END}")
    print(f"  {DIM}  1688: https://open.1688.com{END}")

    for platform in [
        ("TAOBAO", "淘宝"),
        ("JD", "京东"),
        ("DOUYIN_SHOP", "抖店"),
        ("PINDUODUO", "拼多多"),
        ("_1688", "1688"),
    ]:
        key, name = platform
        if yesno(f"\n  配置 {name} 商家 API？", default=False):
            ak = ask(f"  {key}_APP_KEY", default=existing.get(f"{key}_APP_KEY", ""))
            sk = ask(f"  {key}_APP_SECRET", default=existing.get(f"{key}_APP_SECRET", ""), secret=True)
            tk = ask(f"  {key}_ACCESS_TOKEN", default=existing.get(f"{key}_ACCESS_TOKEN", ""), secret=True)
            for k, v in [(f"{key}_APP_KEY", ak), (f"{key}_APP_SECRET", sk), (f"{key}_ACCESS_TOKEN", tk)]:
                if v:
                    new_values[k] = v

    # === 7. 限流/阈值（高级，跳过用默认）===
    section("5/6  限流 / 阈值（按回车用默认）")
    if yesno("自定义限流和对比阈值？", default=False):
        rpm = ask("RATE_LIMIT_PER_MIN", default=existing.get("RATE_LIMIT_PER_MIN", "20"))
        warn = ask("AGREEMENT_THRESHOLD_WARN", default=existing.get("AGREEMENT_THRESHOLD_WARN", "0.85"))
        alert = ask("AGREEMENT_THRESHOLD_ALERT", default=existing.get("AGREEMENT_THRESHOLD_ALERT", "0.70"))
        if rpm: new_values["RATE_LIMIT_PER_MIN"] = rpm
        if warn: new_values["AGREEMENT_THRESHOLD_WARN"] = warn
        if alert: new_values["AGREEMENT_THRESHOLD_ALERT"] = alert

    # === 8. 写入 .env ===
    section("6/6  写入 .env")
    print(f"  将写入以下键:")
    for k, v in new_values.items():
        if "SECRET" in k or "TOKEN" in k or "KEY" in k:
            preview = v[:4] + "***" + v[-4:] if len(v) > 8 else "***"
        else:
            preview = v
        print(f"    {CYAN}{k}{END} = {preview}")
    if not yesno("\n确认写入？", default=True):
        print(f"{YELLOW}已取消{END}")
        return

    write_env(new_values)
    print(f"\n{GREEN}✅ 已写入 {ENV_FILE}{END}")

    # === 9. 验证 ===
    print(f"\n{CYAN}━━━ 验证 ━━━{END}")
    print(f"  跑一次 smoke test 确认配置生效...")
    if yesno("现在跑 smoke test？", default=True):
        r = subprocess.run(
            [sys.executable, "smoke_test.py"],
            cwd=PROJECT_ROOT,
            env={**os.environ, "PYTHONIOENCODING": "utf-8"},
        )
        if r.returncode == 0:
            print(f"\n{GREEN}{BOLD}✅ 配置完成！项目可用。{END}")
            print(f"\n{CYAN}下一步:{END}")
            print(f"  {DIM}# 跑一次真实抓取（需要 proxy/apify）{END}")
            print(f"  python cli.py scrape \"https://www.amazon.com/dp/B08N5WRWNW\"")
            print(f"\n  {DIM}# 或跑 mock 演示{END}")
            print(f"  python quickstart.py")
        else:
            print(f"\n{RED}❌ smoke test 失败{END}")


if __name__ == "__main__":
    main()
