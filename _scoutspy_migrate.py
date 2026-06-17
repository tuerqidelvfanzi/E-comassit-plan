"""
ScoutSpy 迁移脚本 —— 把 ecommerce-scraper/ 迁移到 scoutspy/。

执行步骤（一次性）：
  1. 在 D:/02-学习/06-yitang/app/scoutspy/ 建完整目录树
  2. 复制所有文件（先不动原 ecommerce-scraper/，最后才删）
  3. 改 import 路径
  4. 改 pyproject.toml
  5. 拆文档到 docs/
  6. 写 README.md / SETUP.md / .gitignore / .env.example
  7. 在 scoutspy/ 跑 git init
  8. 跑 pytest 验证

可重入：每次执行会先确认 scoutspy/ 不存在，避免覆盖。
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

# 路径
SRC_ROOT = Path("d:/02-学习/06-yitang/app/ecommerce-scraper")
DST_ROOT = Path("d:/02-学习/06-yitang/app/scoutspy")

# 不能让 DST 已有内容
if DST_ROOT.exists():
    print(f"❌ 目标已存在: {DST_ROOT}")
    print("   如要重新迁移请先删除: rmdir /s /q scoutspy")
    sys.exit(1)

if not SRC_ROOT.exists():
    print(f"❌ 源目录不存在: {SRC_ROOT}")
    sys.exit(1)

print(f"📦 源: {SRC_ROOT}")
print(f"📦 目标: {DST_ROOT}")
print()

# =============================================================================
# 1. 创建目录树
# =============================================================================
DIRS = [
    "src/scoutspy/core",
    "src/scoutspy/fetchers",
    "src/scoutspy/integrations",
    "src/scoutspy/platforms",
    "scripts",
    "tests",
    "docs",
    "data/divergences",
    "data/outputs",
]
for d in DIRS:
    (DST_ROOT / d).mkdir(parents=True, exist_ok=True)
    print(f"  📁 {d}/")
print(f"✅ 目录树已建\n")

# =============================================================================
# 2. 复制库代码（src/scoutspy/）
# =============================================================================
print("📦 复制库代码...")

# 2.1 顶层库文件
LIB_FILES_TOP = [
    "result.py",
    "comparator.py",
    "orchestrator.py",
    "fetcher.py",
    "config.py",
    "logging.py",
]
for f in LIB_FILES_TOP:
    src = SRC_ROOT / "scraper" / f
    dst = DST_ROOT / "src/scoutspy/core" / f
    shutil.copy2(src, dst)
    print(f"  ✓ core/{f}")

# 2.2 platforms/（11 平台枚举 + 4 国际 fetcher）
# 注意：amazon.py / shopee.py / lazada.py / tiktok_shop.py 4 个合并成 fetchers/local.py
#       domestic.py 移到 fetchers/domestic.py
#       __init__.py（Platform 枚举）留在 platforms/
# 同时：4 国际 fetcher 合并入 fetchers/local.py（4 个 class）
#      apify.py 移到 integrations/apify.py
#      merchant_api.py 移到 integrations/merchant_api.py

# 2.2.1 platforms/__init__.py
shutil.copy2(
    SRC_ROOT / "scraper" / "platforms" / "__init__.py",
    DST_ROOT / "src/scoutspy/platforms" / "__init__.py",
)
print("  ✓ platforms/__init__.py")

# 2.2.2 fetchers/local.py（4 国际：amazon + shopee + lazada + tiktok_shop 合并）
# 这个合并要写代码（不能简单 copy），见下面"合并 4 个国际 fetcher"
print("  ⏳ fetchers/local.py (合并 4 个国际 fetcher)")

# 2.2.3 fetchers/domestic.py
shutil.copy2(
    SRC_ROOT / "scraper" / "platforms" / "domestic.py",
    DST_ROOT / "src/scoutspy/fetchers" / "domestic.py",
)
print("  ✓ fetchers/domestic.py")

# 2.2.4 integrations/apify.py
shutil.copy2(
    SRC_ROOT / "scraper" / "apify.py",
    DST_ROOT / "src/scoutspy/integrations" / "apify.py",
)
print("  ✓ integrations/apify.py")

# 2.2.5 integrations/merchant_api.py
shutil.copy2(
    SRC_ROOT / "scraper" / "merchant_api.py",
    DST_ROOT / "src/scoutspy/integrations" / "merchant_api.py",
)
print("  ✓ integrations/merchant_api.py")

# 2.2.6 proxy_doctor.py（核心库版本）
shutil.copy2(
    SRC_ROOT / "proxy_doctor.py",
    DST_ROOT / "src/scoutspy" / "proxy_doctor.py",
)
print("  ✓ proxy_doctor.py")

# 2.2.7 src/scoutspy/__init__.py（需要写一个导出列表）
print("  ⏳ src/scoutspy/__init__.py (写导出)")

# 2.2.8 sub-package __init__.py
for sub in ["core", "fetchers", "integrations", "platforms"]:
    (DST_ROOT / "src/scoutspy" / sub / "__init__.py").write_text(
        f'"""{sub} sub-package of ScoutSpy."""\n',
        encoding="utf-8",
    )
    print(f"  ✓ {sub}/__init__.py")

# =============================================================================
# 3. 复制 7 个入口到 scripts/
# =============================================================================
print("\n📦 复制入口...")
SCRIPTS = [
    "cli.py",
    "compare_view.py",
    "mcp_server.py",
    "setup_wizard.py",
    "quickstart.py",
    "smoke_test.py",
]
for f in SCRIPTS:
    shutil.copy2(SRC_ROOT / f, DST_ROOT / "scripts" / f)
    print(f"  ✓ scripts/{f}")

# proxy_doctor.py 已经在库中；scripts/ 中不重复（避免两份），入口用 `python -m scoutspy.proxy_doctor`

# =============================================================================
# 4. 复制测试
# =============================================================================
print("\n📦 复制测试...")
shutil.copy2(SRC_ROOT / "tests" / "test_core.py", DST_ROOT / "tests" / "test_core.py")
shutil.copy2(SRC_ROOT / "tests" / "__init__.py", DST_ROOT / "tests" / "__init__.py")
print("  ✓ tests/test_core.py")
print("  ✓ tests/__init__.py")

# =============================================================================
# 5. 复制 data/divergences/ 的漂移日志
# =============================================================================
src_div = SRC_ROOT / "data" / "divergences"
if src_div.exists():
    for f in src_div.iterdir():
        if f.is_file():
            shutil.copy2(f, DST_ROOT / "data" / "divergences" / f.name)
            print(f"  ✓ data/divergences/{f.name}")

# =============================================================================
# 6. 复制 install 脚本
# =============================================================================
print("\n📦 复制 install 脚本...")
shutil.copy2(SRC_ROOT / "install.bat", DST_ROOT / "install.bat")
shutil.copy2(SRC_ROOT / "install.sh", DST_ROOT / "install.sh")
print("  ✓ install.bat")
print("  ✓ install.sh")

# =============================================================================
# 7. 复制 .env.example
# =============================================================================
shutil.copy2(SRC_ROOT / ".env.example", DST_ROOT / ".env.example")
print("  ✓ .env.example")

# =============================================================================
# 8. 复制 compare_view.html（如有）
# =============================================================================
if (SRC_ROOT / "compare_view.html").exists():
    shutil.copy2(SRC_ROOT / "compare_view.html", DST_ROOT / "data" / "outputs" / "compare_view.html")
    print("  ✓ data/outputs/compare_view.html")

print("\n✅ 文件复制完成")
print("⏭️  下一步：合并 4 个国际 fetcher + 改 import + 写文档")
