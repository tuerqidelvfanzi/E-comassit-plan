"""
ScoutSpy 迁移第三步：修正 import 路径（config/logging 在 core/）。
"""
from __future__ import annotations

from pathlib import Path

DST_ROOT = Path("d:/02-学习/06-yitang/app/scoutspy")

# config.py 和 logging.py 在 core/ 下，所以 import 要写 scoutspy.core.config
# 之前 fix_imports 把 "from scraper.config" 改成了 "from scoutspy.config"（少了 .core）
# 需要修：from scoutspy.config → from scoutspy.core.config
#       from scoutspy.logging → from scoutspy.core.logging

# 注意：__init__.py 里已经 import 正确（scoutspy.config 实际不对，但那里写的就是）
# 正确做法：要么把 config/logging 提到 scoutspy 顶层（不推荐）
#         要么改所有 import 加上 .core

# 选第二个方案：保留 config/logging 在 core/，修所有 import
import re

# 所有 .py 文件
files_to_fix = []
for f in DST_ROOT.rglob("*.py"):
    if "__pycache__" in f.parts:
        continue
    files_to_fix.append(f)

print(f"📦 修正 {len(files_to_fix)} 个 .py 文件的 import 路径")

count = 0
for f in files_to_fix:
    t = f.read_text(encoding="utf-8")
    new = t
    # 修：from scoutspy.config → from scoutspy.core.config（除 __init__.py 外）
    if f.name != "__init__.py" or "src/scoutspy" in str(f):
        new = re.sub(
            r"^from scoutspy\.config import",
            "from scoutspy.core.config import",
            new,
            flags=re.MULTILINE,
        )
        new = re.sub(
            r"^from scoutspy\.logging import",
            "from scoutspy.core.logging import",
            new,
            flags=re.MULTILINE,
        )
    if new != t:
        f.write_text(new, encoding="utf-8")
        count += 1
        print(f"  ✓ {f.relative_to(DST_ROOT)}")

print(f"\n✅ 修正了 {count} 个文件")
