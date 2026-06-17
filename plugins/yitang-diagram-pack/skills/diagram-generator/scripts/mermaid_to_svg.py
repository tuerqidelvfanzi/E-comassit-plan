#!/usr/bin/env python3
"""Mermaid → SVG 转换（用于 README 预览）。

依赖：npm i -g @mermaid-js/mermaid-cli
用法：
    python mermaid_to_svg.py input.md output_prefix
"""
import io
import re
import subprocess
import sys
import tempfile
from pathlib import Path

# 强制 UTF-8 输出
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")


def extract_mermaid_blocks(md_path: Path) -> list[str]:
    text = md_path.read_text(encoding="utf-8")
    blocks = re.findall(r"```mermaid\n(.*?)```", text, re.S)
    return [b.strip() for b in blocks]


def convert(code: str, out_svg: Path) -> bool:
    with tempfile.NamedTemporaryFile("w", suffix=".mmd", delete=False, encoding="utf-8") as f:
        f.write(code)
        tmp = Path(f.name)
    try:
        result = subprocess.run(
            ["mmdc", "-i", str(tmp), "-o", str(out_svg), "-q"],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            print(f"[ERR] 转换失败: {result.stderr}")
            return False
        print(f"[OK] {out_svg}")
        return True
    finally:
        tmp.unlink(missing_ok=True)


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    md = Path(sys.argv[1])
    out_prefix = Path(sys.argv[2])
    blocks = extract_mermaid_blocks(md)
    print(f"发现 {len(blocks)} 个 mermaid 块")
    ok = 0
    for i, code in enumerate(blocks):
        out = out_prefix.parent / f"{out_prefix.name}_{i+1}.svg"
        if convert(code, out):
            ok += 1
    print(f"成功: {ok}/{len(blocks)}")
    sys.exit(0 if ok == len(blocks) else 1)


if __name__ == "__main__":
    main()
