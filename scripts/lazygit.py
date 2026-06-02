#!/usr/bin/env python3
"""
LazyGit - 节俭同步 v1.0
"""
import os
import json
import re
import sys
from pathlib import Path
from datetime import datetime

CLI = os.environ.get("NOTEBOOKLM_CLI", "notebooklm")
STATE = Path(__file__).parent / "lazygit-state.json"
OUT_DIR = Path(__file__).parent.parent / "docs" / "nblm-research"

def run(cmd):
    env = os.environ.copy()
    # 代理从环境变量继承（HTTP_PROXY/HTTPS_PROXY），不在源码硬编码
    import subprocess
    r = subprocess.run(f'"{CLI}" {cmd}', shell=True, capture_output=True, env=env)
    return (r.stdout + r.stderr).decode("utf-8", errors="replace")

def parse_json(text):
    """从输出中提取纯 JSON（处理 WARNING 等干扰）"""
    # 找第一个 { 开始，到最后一个 } 结束
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        return None
    json_str = text[start:end+1]
    return json.loads(json_str)

def load():
    if STATE.exists():
        return json.loads(STATE.read_text(encoding="utf-8"))
    return {"notebooks": {}, "last": None}

def save(s):
    STATE.write_text(json.dumps(s, indent=2, ensure_ascii=False), encoding="utf-8")

def count_sources(nb_id):
    out = run(f"source list -n {nb_id[:8]}")
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
    out = run(f"source list -n {nb_id[:8]}")
    title_match = re.search(r"\((.+?)\)", out)
    title = title_match.group(1) if title_match else nb_id[:8]
    sources = [l for l in out.split("\n") if "│" in l and "ID" not in l and "─" not in l]
    
    s = load()
    s["notebooks"][nb_id] = {"title": title, "count": len(sources), "date": datetime.now().isoformat()}
    save(s)
    
    print(f"\n✅ 已初始化: {title}")
    print(f"   源文件: {len(sources)} 个")

def pull():
    s = load()
    if not s["notebooks"]:
        print("请先初始化笔记本: lazylazy init <id>")
        return
    
    print("\n📥 选择要拉取的笔记本:")
    items = list(s["notebooks"].items())
    for i, (nid, info) in enumerate(items, 1):
        print(f"  {i}. {info.get('title', nid[:8])}")
    
    choice = input("\n输入编号: ").strip()
    try:
        nb_id = items[int(choice) - 1][0]
    except:
        print("无效选择")
        return
    
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_dir = OUT_DIR / f"pulled_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    out_dir.mkdir(exist_ok=True)
    
    # 获取源列表
    out = run(f"source list -n {nb_id[:8]} --json")
    data = parse_json(out)
    
    if not data:
        print("获取源列表失败")
        return
    
    sources = data.get("sources", [])
    print(f"\n📥 拉取 {len(sources)} 个源文件...\n")
    
    for src in sources:
        src_id = src["id"]
        title = src.get("title", f"source_{src_id[:8]}")
        src_type = src.get("type", "")
        safe = "".join(c if c.isalnum() or c in " -_" else "_" for c in title)[:50]
        
        if src_type in ("media", "video", "audio"):
            print(f"  🎬 {title[:35]}... ⏭️ 跳过（外链）")
            with open(out_dir / "VIDEO_REFS.txt", "a", encoding="utf-8") as f:
                f.write(f"# {title}\n# ID: {src_id}\n\n")
            continue
        
        print(f"  📄 {title[:35]}...", end=" ", flush=True)
        
        ft = run(f"source fulltext {src_id} --json")
        ft_data = parse_json(ft)
        
        if ft_data:
            content = ft_data.get("content", "")
            if content:
                ext = "md" if src_type == "markdown" else "txt"
                (out_dir / f"{safe}.{ext}").write_text(content, encoding="utf-8")
                print(f"✓ {len(content)}字")
            else:
                print("✗ 无内容")
        else:
            print("✗")

    print(f"\n✅ 已保存到: {out_dir.relative_to(OUT_DIR.parent.parent)}")

def main():
    cmd = sys.argv[1].lower() if len(sys.argv) > 1 else ""
    
    if cmd == "status" or cmd == "check" or cmd == "":
        status()
    elif cmd == "init":
        init(sys.argv[2] if len(sys.argv) > 2 else "")
    elif cmd == "pull":
        pull()
    else:
        print(__doc__)

if __name__ == "__main__":
    main()
