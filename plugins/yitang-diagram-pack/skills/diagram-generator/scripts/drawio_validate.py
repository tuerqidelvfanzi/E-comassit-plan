#!/usr/bin/env python3
"""drawio XML 校验工具。

校验项：
1. XML 格式合法
2. 骨架完整：<mxfile> -> <diagram> -> <mxGraphModel> -> <root>
3. 所有 source/target 引用存在
4. 节点 value 非空（除 id=0 / id=1 之外）
5. 警告：孤岛节点

用法：
    python drawio_validate.py <file.drawio>
    python drawio_validate.py <dir>  # 校验目录下所有 .drawio
"""
import io
import sys
import os
import xml.etree.ElementTree as ET
from pathlib import Path

# 强制 UTF-8 输出（Windows CMD 兼容）
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# ASCII fallback 字符
OK = "[OK]"
ERR = "[ERR]"
WARN = "[WARN]"


def parse(path: Path) -> ET.Element:
    return ET.parse(path).getroot()


def check_skeleton(root: ET.Element) -> list[str]:
    errs = []
    if root.tag != "mxfile":
        errs.append(f"根节点应为 <mxfile>，实际为 <{root.tag}>")
    diagrams = root.findall("diagram")
    if not diagrams:
        errs.append("缺少 <diagram>")
    for d in diagrams:
        gm = d.find("mxGraphModel")
        if gm is None:
            errs.append(f"diagram[{d.get('id')}] 缺少 <mxGraphModel>")
            continue
        r = gm.find("root")
        if r is None:
            errs.append(f"diagram[{d.get('id')}] 缺少 <root>")
    return errs


def check_references(root: ET.Element) -> list[str]:
    """检查所有 source/target/parent 引用的 ID 都存在。"""
    ids: set[str] = set()
    for c in root.iter("mxCell"):
        cid = c.get("id")
        if cid:
            ids.add(cid)

    errs = []
    for c in root.iter("mxCell"):
        for attr in ("source", "target", "parent"):
            v = c.get(attr)
            if v and v not in ids:
                errs.append(f"cell[{c.get('id')}] 的 {attr}='{v}' 不存在")
    return errs


def check_empty_value(root: ET.Element) -> list[str]:
    """检查有意义的节点（vertex/edge，id != 0/1）value 是否为空。"""
    warnings = []
    for c in root.iter("mxCell"):
        cid = c.get("id")
        if cid in ("0", "1"):
            continue
        if c.get("vertex") == "1" or c.get("edge") == "1":
            v = (c.get("value") or "").strip()
            if not v and c.get("vertex") == "1":
                warnings.append(f"cell[{cid}] 是 vertex 但 value 为空")
    return warnings


def check_orphan_nodes(root: ET.Element) -> list[str]:
    """检查孤岛节点（既无入边也无出边，且不在子图中）。"""
    referenced = set()
    for c in root.iter("mxCell"):
        if c.get("edge") == "1":
            s = c.get("source")
            t = c.get("target")
            if s: referenced.add(s)
            if t: referenced.add(t)
    orphans = []
    for c in root.iter("mxCell"):
        if c.get("vertex") == "1" and c.get("id") not in referenced and c.get("id") not in ("0", "1"):
            if c.get("connectable") == "0":
                continue
            v = c.get("value") or "(匿名)"
            orphans.append(f"  - {c.get('id')} = {v[:30]}")
    return orphans


def validate_file(path: Path) -> bool:
    print(f"\n=== {path} ===")
    try:
        root = parse(path)
    except ET.ParseError as e:
        print(f"{ERR} XML 解析失败: {e}")
        return False

    all_ok = True
    for fn, label, hard in [
        (check_skeleton, "骨架", True),
        (check_references, "引用", True),
        (check_empty_value, "空值", False),
        (check_orphan_nodes, "孤岛", False),
    ]:
        issues = fn(root)
        icon = ERR if hard and issues else (WARN if issues else OK)
        print(f"  {icon} {label}: {len(issues)} 个问题")
        for it in issues[:10]:
            print(f"    {it}")
        if len(issues) > 10:
            print(f"    ... 还有 {len(issues)-10} 个")
        if hard and issues:
            all_ok = False
    return all_ok


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    target = Path(sys.argv[1])
    files = []
    if target.is_dir():
        files = list(target.rglob("*.drawio"))
    elif target.is_file():
        files = [target]
    else:
        print(f"{ERR} 路径不存在: {target}")
        sys.exit(1)
    if not files:
        print(f"{WARN} 未找到 .drawio 文件")
        sys.exit(0)
    results = [validate_file(f) for f in files]
    passed = sum(results)
    print(f"\n汇总: {passed}/{len(results)} 文件通过硬校验")
    sys.exit(0 if passed == len(results) else 1)


if __name__ == "__main__":
    main()
