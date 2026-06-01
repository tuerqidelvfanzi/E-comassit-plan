#!/usr/bin/env python3
"""
LazyGit - 节俭同步 v1.0
本地 ↔ 云端 按需同步

使用:
    python lazylazy.py              # 检查状态
    python lazylazy.py init <id>   # 初始化笔记本
    python lazylazy.py pull        # 拉取内容
"""
import os
import json
import re
import sys
from pathlib import Path
from datetime import datetime

CLI = r"C:\Users\HUAWEI\AppData\Roaming\Python\Python312\Scripts\notebooklm.exe"
STATE = Path(__file__).parent / "lazygit-state.json"

def run(cmd):
    env = os.environ.copy()
    env["HTTP_PROXY"] = "http://127.0.0.1:7890"
    env["HTTPS_PROXY"] = "http://127.0.0.1:7890"
    import subprocess
    r = subprocess.run(f'"{CLI}" {cmd}', shell=True, capture_output=True, env=env)
    out = r.stdout + r.stderr
    return out.decode("utf-8", errors="replace")

def load():
    if STATE.exists():
        return json.loads(STATE.read_text(encoding="utf-8"))
    return {"notebooks": {}, "last": None}

def save(s):
    STATE.write_text(json.dumps(s, indent=2, ensure_ascii=False), encoding="utf-8")

def count_sources(nb_id):
    """获取笔记本源文件数量"""
    out = run(f"source list -n {nb_id[:8]}")
    # 统计表格行数（排除表头和边框）
    lines = [l for l in out.split("\n") if "│" in l and "ID" not in l and "─" not in l]
    return len(lines)

def status():
    s = load()
    print("\n🔍 LazyGit 状态")
    print(f"上次检查: {s.get('last', '从未')}\n")
    print("-" * 45)
    
    if not s["notebooks"]:
        print("尚未同步任何笔记本")
        print("\n初始化: lazylazy init <笔记本ID前8位>")
    else:
        for nid, info in s["notebooks"].items():
            cloud_count = count_sources(nid)
            local_count = info.get("count", 0)
            
            if cloud_count == local_count:
                icon = "✅"
            elif cloud_count > local_count:
                icon = "📥"
            else:
                icon = "📤"
            
            print(f"{icon} {info.get('title', nid[:8])}")
            print(f"   本地:{local_count} 云端:{cloud_count}")
    
    print("-" * 45)
    s["last"] = datetime.now().isoformat()
    save(s)

def init(nb_id):
    """初始化笔记本"""
    out = run(f"source list -n {nb_id[:8]}")
    
    # 提取标题
    title_match = re.search(r"\((.+?)\)", out)
    title = title_match.group(1) if title_match else nb_id[:8]
    
    # 统计源数量
    sources = [l for l in out.split("\n") if "│" in l and "ID" not in l and "─" not in l]
    
    s = load()
    s["notebooks"][nb_id] = {"title": title, "count": len(sources), "date": datetime.now().isoformat()}
    save(s)
    
    print(f"\n✅ 已初始化: {title}")
    print(f"   源文件: {len(sources)} 个")

def main():
    cmd = sys.argv[1].lower() if len(sys.argv) > 1 else "status"
    arg = sys.argv[2] if len(sys.argv) > 2 else None
    
    if cmd in ("status", "check", ""):
        status()
    elif cmd == "init":
        if arg:
            init(arg)
        else:
            print("用法: lazylazy init <笔记本ID前8位>")
    else:
        print(__doc__)

if __name__ == "__main__":
    main()
