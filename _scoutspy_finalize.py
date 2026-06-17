"""
ScoutSpy 迁移第二步：合并 + 改 import + 写文档 + 测。
"""
from __future__ import annotations

import re
import shutil
import subprocess
import sys
from pathlib import Path

SRC_ROOT = Path("d:/02-学习/06-yitang/app/ecommerce-scraper")
DST_ROOT = Path("d:/02-学习/06-yitang/app/scoutspy")


# =============================================================================
# 1. 合并 4 个国际 fetcher → fetchers/local.py
# =============================================================================
print("📦 合并 4 个国际 fetcher → fetchers/local.py")

# 读 4 个文件
amazon_src = (SRC_ROOT / "scraper" / "platforms" / "amazon.py").read_text(encoding="utf-8")
shopee_src = (SRC_ROOT / "scraper" / "platforms" / "shopee.py").read_text(encoding="utf-8")
lazada_src = (SRC_ROOT / "scraper" / "platforms" / "lazada.py").read_text(encoding="utf-8")
tiktok_src = (SRC_ROOT / "scraper" / "platforms" / "tiktok_shop.py").read_text(encoding="utf-8")

# 改 import 路径（scraper.* → scoutspy.*）
def fix_imports(text: str) -> str:
    return (text
        .replace("from scraper.fetcher", "from scoutspy.core.fetcher")
        .replace("from scraper.logging", "from scoutspy.logging")
        .replace("from scraper.result", "from scoutspy.core.result")
        .replace("from scraper.platforms", "from scoutspy.platforms")
        .replace("from scraper.apify", "from scoutspy.integrations.apify")
        .replace("from scraper.merchant_api", "from scoutspy.integrations.merchant_api")
        .replace("from scraper.comparator", "from scoutspy.core.comparator")
        .replace("from scraper.config", "from scoutspy.config")
        .replace("from scraper import", "from scoutspy import")
    )

# 拼接：去掉每个文件的 docstring 和 __future__，只保留 class 定义
def extract_class_block(text: str, class_name: str) -> str:
    """从文件中提取某个 class 的完整定义"""
    # 找 class 定义开始
    m = re.search(rf"^class {class_name}\b", text, re.MULTILINE)
    if not m:
        return ""
    start = m.start()
    # 找下一个顶级 def/class（缩进=0）
    rest = text[start:]
    lines = rest.split("\n")
    end = len(lines)
    for i, line in enumerate(lines[1:], start=1):
        if line and not line.startswith((" ", "\t", "@")):
            end = i
            break
    return "\n".join(lines[:end])


# 4 个 class
amazon_block = extract_class_block(amazon_src, "AmazonLocalFetcher")
shopee_block = extract_class_block(shopee_src, "ShopeeLocalFetcher")
lazada_block = extract_class_block(lazada_src, "LazadaLocalFetcher")
tiktok_block = extract_class_block(tiktok_src, "TikTokShopLocalFetcher")

# 注意：amazon.py 的 AmazonLocalFetcher 包含 _extract_text / _parse_price / _parse_stock
# 这些是 Amazon 专用的，不需要在 local.py 顶层定义（每个 fetcher 内部的方法都自带）
# 但 amazon.py 顶层有 AMAZON_CAPTCHA_MARKERS / AMAZON_BLOCK_MARKERS / DEFAULT_UA 常量
# 这些是 amazon 专用的，保留在 AmazonLocalFetcher class 内即可（已经是）

# 顶层 helper：从 4 个文件中提取各自的常量（DEFAULT_UA, CAPTCHA_MARKERS 等）
def extract_module_constants(text: str) -> str:
    """提取模块顶层常量（类定义之前的赋值语句）"""
    # 找第一个 class 位置
    m = re.search(r"^class \w+\b", text, re.MULTILINE)
    if not m:
        return ""
    head = text[:m.start()]
    # 保留 import / __future__ / docstring / 常量赋值
    lines = head.split("\n")
    out = []
    skip_docstring = False
    for line in lines:
        s = line.strip()
        # 跳过模块 docstring
        if out == [] and (s.startswith('"""') or s.startswith("'''")):
            skip_docstring = not s.endswith(s[:3]) and not s.endswith(s[-3:])
            continue
        if skip_docstring:
            if s.endswith('"""') or s.endswith("'''"):
                skip_docstring = False
            continue
        out.append(line)
    return "\n".join(out)


amazon_consts = extract_module_constants(amazon_src)

# 写 local.py
local_py = f'''"""
国际电商本地 fetcher —— 4 平台（Amazon / Shopee / Lazada / TikTok Shop）。

4 个 fetcher 合并在单文件，按平台路由。
"""
from __future__ import annotations

import json
import re
from datetime import datetime
from typing import Optional

import httpx
from bs4 import BeautifulSoup

from scoutspy.core.fetcher import Fetcher
from scoutspy.logging import log
from scoutspy.core.result import ProductResult, Source, StockStatus


# ============================================================
# Amazon
# ============================================================

{amazon_consts}

{amazon_block}


# ============================================================
# Shopee
# ============================================================

{shopee_block}


# ============================================================
# Lazada
# ============================================================

{lazada_block}


# ============================================================
# TikTok Shop
# ============================================================

{tiktok_block}
'''

(DST_ROOT / "src" / "scoutspy" / "fetchers" / "local.py").write_text(local_py, encoding="utf-8")
print(f"  ✓ fetchers/local.py ({len(local_py)} chars)")


# =============================================================================
# 2. 改 domestic.py 的 import
# =============================================================================
print("\n📦 改 fetchers/domestic.py 的 import")
domestic_text = (DST_ROOT / "src" / "scoutspy" / "fetchers" / "domestic.py").read_text(encoding="utf-8")
domestic_text = fix_imports(domestic_text)
(DST_ROOT / "src" / "scoutspy" / "fetchers" / "domestic.py").write_text(domestic_text, encoding="utf-8")
print("  ✓ fetchers/domestic.py")


# =============================================================================
# 3. 改 integrations/apify.py 和 merchant_api.py 的 import
# =============================================================================
print("\n📦 改 integrations/ 的 import")
for f in ["apify.py", "merchant_api.py"]:
    p = DST_ROOT / "src" / "scoutspy" / "integrations" / f
    t = p.read_text(encoding="utf-8")
    t = fix_imports(t)
    p.write_text(t, encoding="utf-8")
    print(f"  ✓ integrations/{f}")


# =============================================================================
# 4. 改 core/ 的 6 个文件
# =============================================================================
print("\n📦 改 core/ 的 import")
for f in ["result.py", "comparator.py", "orchestrator.py", "fetcher.py", "config.py", "logging.py"]:
    p = DST_ROOT / "src" / "scoutspy" / "core" / f
    t = p.read_text(encoding="utf-8")
    t = fix_imports(t)
    p.write_text(t, encoding="utf-8")
    print(f"  ✓ core/{f}")


# =============================================================================
# 5. 改 platforms/__init__.py
# =============================================================================
print("\n📦 改 platforms/__init__.py")
p = DST_ROOT / "src" / "scoutspy" / "platforms" / "__init__.py"
t = p.read_text(encoding="utf-8")
t = fix_imports(t)
p.write_text(t, encoding="utf-8")
print("  ✓ platforms/__init__.py")


# =============================================================================
# 6. 改 proxy_doctor.py 的 import
# =============================================================================
print("\n📦 改 proxy_doctor.py 的 import")
p = DST_ROOT / "src" / "scoutspy" / "proxy_doctor.py"
t = p.read_text(encoding="utf-8")
t = fix_imports(t)
p.write_text(t, encoding="utf-8")
print("  ✓ src/scoutspy/proxy_doctor.py")


# =============================================================================
# 7. 写 src/scoutspy/__init__.py
# =============================================================================
print("\n📦 写 src/scoutspy/__init__.py")
init_py = '''"""
ScoutSpy —— 双轨制电商抓取引擎
================================

E-commerce scraper with local + Apify auto-comparison.

Quick start:
    from scoutspy import scrape
    result = await scrape("https://www.amazon.com/dp/B0X")
    print(result.recommended.title, result.recommended.price)
"""
from __future__ import annotations

__version__ = "0.1.0"
__project__ = "ScoutSpy"
__description__ = "双轨制电商抓取引擎 —— 本地 + Apify 自动对比"

# 主入口
from scoutspy.core.orchestrator import scrape, scrape_batch

# 数据模型
from scoutspy.core.result import (
    ProductResult,
    DualScrapeResult,
    ComparisonResult,
    FieldConflict,
    Source,
    StockStatus,
    ConflictSeverity,
    ConflictResolution,
)

# 平台枚举
from scoutspy.platforms import Platform, detect_platform

# 配置
from scoutspy.config import settings, reload_settings

# 工具
from scoutspy.logging import setup_logging, log

__all__ = [
    "__version__",
    "__project__",
    "__description__",
    "scrape",
    "scrape_batch",
    "ProductResult",
    "DualScrapeResult",
    "ComparisonResult",
    "FieldConflict",
    "Source",
    "StockStatus",
    "ConflictSeverity",
    "ConflictResolution",
    "Platform",
    "detect_platform",
    "settings",
    "reload_settings",
    "setup_logging",
    "log",
]
'''
(DST_ROOT / "src" / "scoutspy" / "__init__.py").write_text(init_py, encoding="utf-8")
print("  ✓ src/scoutspy/__init__.py")


# =============================================================================
# 8. 改 7 个入口的 import
# =============================================================================
print("\n📦 改 scripts/ 7 个入口的 import")
SCRIPTS = ["cli.py", "compare_view.py", "mcp_server.py", "setup_wizard.py", "quickstart.py", "smoke_test.py"]
for f in SCRIPTS:
    p = DST_ROOT / "scripts" / f
    t = p.read_text(encoding="utf-8")
    t = fix_imports(t)
    p.write_text(t, encoding="utf-8")
    print(f"  ✓ scripts/{f}")


# =============================================================================
# 9. 改 tests/test_core.py 的 import
# =============================================================================
print("\n📦 改 tests/ 的 import")
p = DST_ROOT / "tests" / "test_core.py"
t = p.read_text(encoding="utf-8")
t = fix_imports(t)
# 还有 from scraper.platforms.amazon import AmazonLocalFetcher
# 现在 Amazon 在 scoutspy.fetchers.local 里
t = t.replace(
    "from scraper.platforms.amazon import AmazonLocalFetcher",
    "from scoutspy.fetchers.local import AmazonLocalFetcher",
)
# 同样 ShopeeLocalFetcher 也在 local 里
t = t.replace(
    "from scraper.platforms.shopee import ShopeeLocalFetcher",
    "from scoutspy.fetchers.local import ShopeeLocalFetcher",
)
p.write_text(t, encoding="utf-8")
print("  ✓ tests/test_core.py")


print("\n✅ Import 改写完成")
