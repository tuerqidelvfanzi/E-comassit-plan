#!/usr/bin/env python3
# build_arch_v100.py — V1.0.0 生成器
import re
from pathlib import Path

ROOT = Path("d:/02-学习/06-yitang/app")
SRC = ROOT / "docs/architecture-diagrams/ecommerce-assistant-architecture.drawio"
DST_DIR = ROOT / "docs/architecture-diagrams"
DST = DST_DIR / "电商助手架构图V1.0.0.drawio"
V010 = DST_DIR / "电商助手架构图V0.1.0.drawio"

src_text = SRC.read_text(encoding="utf-8")

diag_re = re.compile(r'(<diagram\s+name="[^"]+"\s+id="[^"]+">.*?</diagram>)', re.DOTALL)
diagrams = diag_re.findall(src_text)
print(f"[setup] {len(diagrams)} diagrams")

node_re = re.compile(r'(<mxCell\s+id=")([^"]+)("[^>]*?value=")([^"]*)(")')

def is_protected(nid):
    return nid in ("0","1") or nid.startswith("sg") or nid.startswith("nt")

def fix_value(m):
    pre, nid, mid, val, suf = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)
    if is_protected(nid):
        return m.group(0)
    lines = [l for l in val.split("\n") if l.strip()]
    if len(lines) > 2:
        val = "\n".join(lines[:2])
    return pre + nid + mid + val + suf

geom_re = re.compile(
    r'<mxCell\s+id="([^"]+)"[^>]*?vertex="1"[^>]*?>'
    r'<mxGeometry\s+x="([^"]+)"\s+y="([^"]+)"'
    r'(?:\s+width="([^"]+)")?(?:\s+height="([^"]+)")?'
    r'\s+as="geometry"/></mxCell>'
)

edge_re = re.compile(
    r'(<mxCell\s+id="e\d+"[^>]*?value="[^"]*"\s+style=")'
    r'([^"]*?)'
    r'("\s+edge="1"\s+parent="1"\s+source=")'
    r'([^"]+)'
    r'("\s+target=")'
    r'([^"]+)'
    r'"(><mxGeometry[^/]*?/></mxCell>)'
)

def infer_ports(sxy, txy):
    sx, sy, sw, sh = sxy
    tx, ty, tw, th = txy
    scx, scy = sx + sw/2, sy + sh/2
    tcx, tcy = tx + tw/2, ty + th/2
    dx, dy = tcx - scx, tcy - scy
    adx, ady = abs(dx), abs(dy)
    if adx >= ady:
        if dx > 0: return ("1","0.5"), ("0","0.5")
        return ("0","0.5"), ("1","0.5")
    if dy > 0: return ("0.5","1"), ("0.5","0")
    return ("0.5","0"), ("0.5","1")

new_diagrams = []
for idx, diag in enumerate(diagrams):
    new = node_re.sub(fix_value, diag)
    vg = {}
    for m in geom_re.finditer(new):
        vg[m.group(1)] = (float(m.group(2)), float(m.group(3)),
                          float(m.group(4) or 0), float(m.group(5) or 0))
    edge_count = len(edge_re.findall(new))
    injected = [0]
    def fix_edge(m, _vg=vg, _c=injected):
        pre = m.group(1)
        style = m.group(2)
        mid1 = m.group(3)
        src = m.group(4)
        mid2 = m.group(5)
        tgt = m.group(6)
        suf = m.group(7)
        if src not in _vg or tgt not in _vg:
            return m.group(0)
        ep, ip = infer_ports(_vg[src], _vg[tgt])
        style = re.sub(r'(exit|entry)[XY](?:[DC][xy])?=[\d.]+;?', '', style)
        if 'orthogonalEdgeStyle' not in style:
            style = 'orthogonalEdgeStyle=1;' + style
        ports = f"exitX={ep[0]};exitY={ep[1]};exitDx=0;exitDy=0;entryX={ip[0]};entryY={ip[1]};entryDx=0;entryDy=0;"
        _c[0] += 1
        return pre + ports + style + mid1 + src + mid2 + tgt + chr(34) + suf
    new = edge_re.sub(fix_edge, new)
    print(f"  P{idx+1}: v={len(vg)} e={edge_count} 注入={injected[0]}")
    new_diagrams.append(new)

m_wrap = re.match(r'(.*?<mxfile[^>]*>)(.*?)(</mxfile>)', src_text, re.DOTALL)
header, body, footer = m_wrap.group(1), m_wrap.group(2), m_wrap.group(3)

def replace_diagrams(b, ds):
    out = []; last = 0
    for d in diag_re.finditer(b):
        out.append(b[last:d.start()])
        out.append(ds.pop(0))
        last = d.end()
    out.append(b[last:])
    return "".join(out)

new_body = replace_diagrams(body, list(new_diagrams))
new_text = header + new_body + footer

if not V010.exists():
    SRC.rename(V010)
    print(f"[归档] -> {V010.name}")
DST.write_text(new_text, encoding="utf-8")
print(f"[完成] {DST.name} ({DST.stat().st_size:,} 字节)")
