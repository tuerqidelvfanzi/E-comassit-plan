#!/usr/bin/env python3
# build_deep_v109.py — 架构图深层重新分析 V1.0.9 生成器
# V1.0.9: 9 张图系统化重写（基于用户逐图反馈）
#   - 全图统一"本应用"称谓（不再用"b站"）
#   - 所有节点标"实现状态" (✅/📋/🚧/❌)
#   - 加图例、读图说明、用户故事、ERP边界
# V1.0.8: 补完 9 张图（C2/C3/C5/C6/C7/C8/C9/C11/C12），12 张全部为实图
# V1.0.7: 补 V1.0.6 漏掉的"线段拐弯"
# V1.0.6: 修了"线/节点结构"
# V1.0.5: 4 列布局 + 24 条边 hint
# V1.0.4: 尝试加底板+Pool中转（回退）
# V1.0.3: 用户的 4 列布局手工版
# V1.0.2: 加大间距 + 显式边端口
# V1.0.0: 初版
import re
from pathlib import Path

ROOT = Path("d:/02-学习/06-yitang/app")
# 当前版本（每次小步修改改这里，绝不覆盖历史版本）
DST = ROOT / "docs/architecture-diagrams/架构图深层重新分析V1.0.9.drawio"
# 历史基线（只读）
V100 = ROOT / "docs/architecture-diagrams/架构图深层重新分析V1.0.0.drawio"
V103 = ROOT / "docs/architecture-diagrams/架构图深层重新分析V1.0.3.drawio"
V104 = ROOT / "docs/architecture-diagrams/架构图深层重新分析V1.0.4.drawio"
V105 = ROOT / "docs/architecture-diagrams/架构图深层重新分析V1.0.5.drawio"

def xml_attr(s: str) -> str:
    return (s.replace('&', '&amp;')
             .replace('<', '&lt;')
             .replace('>', '&gt;')
             .replace('"', '&quot;'))

def clip2(text: str) -> str:
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    return '\n'.join(lines[:2])

NODE_ID = 0
def reset_ids():
    global NODE_ID
    NODE_ID = 0
def nid():
    global NODE_ID
    NODE_ID += 1
    return f"n{NODE_ID}"

# 节点几何字典 (用于端口推断)
GEOM = {}

STYLE_DEFAULT = "rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;"
STYLE_TITLE = "rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=14;fontStyle=1;"
STYLE_PHASE = "rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=13;fontStyle=1;"
STYLE_ACTOR = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#f8cecc;strokeColor=#b85450;"
STYLE_DATA = "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#e1d5e7;strokeColor=#9673a6;"
STYLE_BUS = "rounded=0;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;fontSize=12;fontStyle=3;"
STYLE_EXTERN = "rounded=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;dashed=1;fontSize=11;"

def node(x, y, w, h, label, style=STYLE_DEFAULT):
    cid = nid()
    GEOM[cid] = (x, y, w, h)
    safe = xml_attr(clip2(label))
    return (cid, f'<mxCell id="{cid}" value="{safe}" style="{style}" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')

# 端口方向
PORT = {
    'right': ('1', '0.5'),
    'left':  ('0', '0.5'),
    'top':   ('0.5', '0'),
    'bot':   ('0.5', '1'),
}

def infer_ports(src, tgt):
    """根据源/目标几何推断端口：同行走左右，同列走上下。"""
    sx, sy, sw, sh = GEOM[src]
    tx, ty, tw, th = GEOM[tgt]
    scx, scy = sx + sw/2, sy + sh/2
    tcx, tcy = tx + tw/2, ty + th/2
    dx, dy = tcx - scx, tcy - scy
    # y 方向重叠 → 同行
    y_overlap = (sy < ty + th) and (ty < sy + sh)
    # x 方向重叠 → 同列
    x_overlap = (sx < tx + tw) and (tx < sx + sw)
    if y_overlap:
        if dx > 0: return 'right', 'left'
        return 'left', 'right'
    if x_overlap:
        if dy > 0: return 'bot', 'top'
        return 'top', 'bot'
    # 既不同行也不同列：按距离主导方向
    if abs(dx) > abs(dy):
        if dx > 0: return 'right', 'left'
        return 'left', 'right'
    if dy > 0: return 'bot', 'top'
    return 'top', 'bot'

def edge(src, tgt, label="", style="", hint=None, waypoints=None, custom=False,
         source_point=None, target_point=None, as_offset=False):
    """画一条有向边。

    hint: 可选 dict {'src': 'bot'|'top'|'left'|'right', 'tgt': ...}
          用于强制走某个端口方向（避免自动推断导致的跨节点）。
    waypoints: 可选 list of dict {'x':, 'y':, 'as':?}
          强制走特定路径的拐点。**会包在 <Array as="points"> 里**（drawio 硬性要求）。
    custom: True 时不附加 base 样式（strokeColor=#6c8ebf 等），用传入的 style。
    source_point / target_point: 可选 dict {'x':, 'y':}
          用于 U 形绕路时指定 sourcePoint/targetPoint 锚点。
    as_offset: True 时在 mxGeometry 里加一个空的 <mxPoint as="offset"/> 标记，
          表示 waypoints 是相对偏移而非绝对坐标（V1.0.3 写→目标平台用的就是这个）。
    """
    cid = nid()
    port = ""
    if src in GEOM and tgt in GEOM:
        if hint and 'src' in hint and 'tgt' in hint:
            sp, tp = hint['src'], hint['tgt']
        else:
            sp, tp = infer_ports(src, tgt)
        ex, ey = PORT[sp]
        ix, iy = PORT[tp]
        port = f"exitX={ex};exitY={ey};exitDx=0;exitDy=0;entryX={ix};entryY={iy};entryDx=0;entryDy=0;"
    if custom:
        full = style
    else:
        base = "endArrow=classic;html=1;rounded=0;orthogonalEdgeStyle=1;strokeColor=#6c8ebf;"
        if label:
            base += "labelBackgroundColor=#ffffff;fontSize=11;"
        full = port + base + style
    safe = xml_attr(label)
    if waypoints or source_point or target_point or as_offset:
        # drawio 硬性要求 waypoints 必须在 <Array as="points"> 里
        if waypoints:
            pts_xml = ''.join(
                f'<mxPoint x="{wp["x"]}" y="{wp["y"]}"' +
                    (f' as="{wp["as"]}"' if wp.get("as") else '') + '/>'
                for wp in waypoints
            )
            array_xml = f'<Array as="points">{pts_xml}</Array>'
        else:
            array_xml = ''
        # 注意: V1.0.3 的 offset 边 mxGeometry 带 x="0.002", 否则 drawio 解析失败
        offset_attr = ' x="0.002"' if as_offset else ''
        offset_xml = '<mxPoint as="offset" />' if as_offset else ''
        sp_xml = (f'<mxPoint x="{source_point["x"]}" y="{source_point["y"]}" as="sourcePoint" />'
                  if source_point else '')
        tp_xml = (f'<mxPoint x="{target_point["x"]}" y="{target_point["y"]}" as="targetPoint" />'
                  if target_point else '')
        geom = f'<mxGeometry relative="1"{offset_attr} as="geometry">{offset_xml}{array_xml}{sp_xml}{tp_xml}</mxGeometry>'
    else:
        geom = '<mxGeometry relative="1" as="geometry"/>'
    return (cid, f'<mxCell id="{cid}" value="{safe}" style="{full}" edge="1" parent="1" source="{src}" target="{tgt}">{geom}</mxCell>')


def page_c1():
    """C1 业务全景 — 三段核心（V1.0.2 加大间距、留出通道）"""
    reset_ids()
    page_w, page_h = 1280, 800
    out = []

    # ===== 标题区 =====
    nid_t, s = node(340, 20, 600, 50, "电商 AI 助手 · 业务全景\n(单店+店群 · 多对多 · 三段闭环)", STYLE_TITLE)
    out.append(s)

    # ===== 角色 + 三段主轴 =====
    # 横向布局：actor(180) | gap(40) | p1(240) | gap(40) | p2(240) | gap(40) | p3(240) | right-margin
    # 总宽 = 180+40+240+40+240+40+240 = 1020；left=130, right=130
    ACTOR_X, ACTOR_W = 130, 180
    P_W, GAP = 240, 40
    P1_X = ACTOR_X + ACTOR_W + GAP          # 350
    P2_X = P1_X + P_W + GAP                  # 630
    P3_X = P2_X + P_W + GAP                  # 910
    PHASE_Y, PHASE_H = 170, 80

    nid_u, s = node(ACTOR_X, PHASE_Y, ACTOR_W, PHASE_H, "小卖家 SaaS\n(单店为主\n+ 店群支持)", STYLE_ACTOR)
    out.append(s)

    nid_p1, s = node(P1_X, PHASE_Y, P_W, PHASE_H, "① 抓数据\n多源采集", STYLE_PHASE)
    out.append(s)
    nid_p2, s = node(P2_X, PHASE_Y, P_W, PHASE_H, "② 改写\n规则+AI 管线", STYLE_PHASE)
    out.append(s)
    nid_p3, s = node(P3_X, PHASE_Y, P_W, PHASE_H, "③ 写数据\n多目标发布", STYLE_PHASE)
    out.append(s)

    # ===== 细节行 y=300 / Bus 行 y=380 =====
    # 每块宽度 240，与上方 phase 对齐
    DET_Y, DET_H = 300, 50
    BUS_Y, BUS_H = 380, 50
    # 块内：左小节点(100) + 通道(20) + 右小节点(100) = 220，居中
    D_W, D_GAP = 100, 20
    D_LEFT = 10  # 块内左边距
    D1A_X = P1_X + D_LEFT              # 360
    D1B_X = D1A_X + D_W + D_GAP        # 480
    D2A_X = P2_X + D_LEFT              # 640
    D2B_X = D2A_X + D_W + D_GAP        # 760
    D3A_X = P3_X + D_LEFT              # 920
    D3B_X = D3A_X + D_W + D_GAP        # 1040

    # 抓细节
    nid_s1a, s = node(D1A_X, DET_Y, D_W, DET_H, "1688/淘宝\n拼多多", STYLE_DEFAULT)
    out.append(s)
    nid_s1b, s = node(D1B_X, DET_Y, D_W, DET_H, "榜单/链接\n插件抓取", STYLE_DEFAULT)
    out.append(s)
    nid_s1c, s = node(P1_X, BUS_Y, P_W, BUS_H, "→ RawProduct\n(采集箱)", STYLE_BUS)
    out.append(s)

    # 改细节
    nid_s2a, s = node(D2A_X, DET_Y, D_W, DET_H, "违禁/定价\nSKU 6 段", STYLE_DEFAULT)
    out.append(s)
    nid_s2b, s = node(D2B_X, DET_Y, D_W, DET_H, "标题/图片\n详情翻译", STYLE_DEFAULT)
    out.append(s)
    nid_s2c, s = node(P2_X, BUS_Y, P_W, BUS_H, "→ Processed\n(加工后)", STYLE_BUS)
    out.append(s)

    # 写细节
    nid_s3a, s = node(D3A_X, DET_Y, D_W, DET_H, "Shopee\n多站", STYLE_DEFAULT)
    out.append(s)
    nid_s3b, s = node(D3B_X, DET_Y, D_W, DET_H, "TikTok Shop\n多站", STYLE_DEFAULT)
    out.append(s)
    nid_s3c, s = node(P3_X, BUS_Y, P_W, BUS_H, "→ 商品在售\n(平台 SKU)", STYLE_BUS)
    out.append(s)

    # ===== 价值点 y=500 (与 Bus 留 60px 通道) =====
    V_Y, V_H = 500, 80
    V_W, V_GAP = 270, 25
    V1_X = 130
    V2_X = V1_X + V_W + V_GAP            # 425
    V3_X = V2_X + V_W + V_GAP            # 720
    V4_X = V3_X + V_W + V_GAP            # 1015

    nid_v1, s = node(V1_X, V_Y, V_W, V_H, "价值 1 · 三段闭环\n30 分钟 → 5 分钟", STYLE_DEFAULT)
    out.append(s)
    nid_v2, s = node(V2_X, V_Y, V_W, V_H, "价值 2 · 多对多\n多源 → 多目标", STYLE_DEFAULT)
    out.append(s)
    nid_v3, s = node(V3_X, V_Y, V_W, V_H, "价值 3 · AI 模糊段\nRAG + 规则", STYLE_DEFAULT)
    out.append(s)
    nid_v4, s = node(V4_X, V_Y, V_W, V_H, "价值 4 · 聚焦上品\n不做完整 ERP", STYLE_DEFAULT)
    out.append(s)

    # ===== 三棱镜方法论 y=620 =====
    nid_m, s = node(130, 620, 1020, 50,
                    "三棱镜 · A 高频重复→规则 | B 高频模糊→AI辅助 | C 中频→选品 | D 排除→ERP",
                    STYLE_BUS)
    out.append(s)

    # ===== 平台/第三方注脚 y=700 =====
    nid_nt, s = node(130, 700, 1020, 70,
                     "平台策略：多对多(多源→多目标)\n第三方(店八方/妙手/Easy Boss/聚水潭/象寄)=只参考不复用",
                     STYLE_EXTERN)
    out.append(s)

    # ===== 边 (走 infer_ports 自动正交) =====
    out.append(edge(nid_u, nid_p1, "登录")[1])
    out.append(edge(nid_p1, nid_p2, "加工")[1])
    out.append(edge(nid_p2, nid_p3, "发布")[1])
    out.append(edge(nid_p1, nid_s1a)[1])
    out.append(edge(nid_p1, nid_s1b)[1])
    out.append(edge(nid_s1a, nid_s1c)[1])
    out.append(edge(nid_s1b, nid_s1c)[1])
    out.append(edge(nid_p2, nid_s2a)[1])
    out.append(edge(nid_p2, nid_s2b)[1])
    out.append(edge(nid_s2a, nid_s2c)[1])
    out.append(edge(nid_s2b, nid_s2c)[1])
    out.append(edge(nid_p3, nid_s3a)[1])
    out.append(edge(nid_p3, nid_s3b)[1])
    out.append(edge(nid_s3a, nid_s3c)[1])
    out.append(edge(nid_s3b, nid_s3c)[1])

    # bus→value 4 条：3 条 bot→top 垂直 (y=465 通道各占一段 x) + 1 条 right→top
    # 重映射以避免 4 条共享 y=465 通道造成水平段重叠：
    #   s1c→v1 (x=265-470)  | s2c→v2 (x=560-750) | s3c→v3 (x=855-1030) | s3c→v4 (x=1150 直下)
    out.append(edge(nid_s1c, nid_v1, "提速", hint={'src':'bot', 'tgt':'top'})[1])
    out.append(edge(nid_s2c, nid_v2, "改写", hint={'src':'bot', 'tgt':'top'})[1])
    out.append(edge(nid_s3c, nid_v3, "上架", hint={'src':'bot', 'tgt':'top'})[1])
    out.append(edge(nid_s3c, nid_v4, "聚焦", hint={'src':'right', 'tgt':'top'})[1])

    return page_w, page_h, out


def build_diagram(idx, name, page_w, page_h, nodes):
    diagram_id = f"diag-{idx}-{name}"
    cells = "\n          ".join(nodes)
    return f'''<diagram id="{diagram_id}" name="{name}">
      <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{page_w}" pageHeight="{page_h}" math="0" shadow="0">
        <root>
          <mxCell id="0"/>
          <mxCell id="1" parent="0"/>
          {cells}
        </root>
      </mxGraphModel>
    </diagram>'''


def main():
    """（V1.0.0 旧版入口，已禁用以避免覆盖 V1.0.0 原文件）

    如需重新生成 V1.0.0，请手动调用 build_diagram(1, 'C1-业务全景', ...)
    单独导出到 V100 路径。
    """
    raise RuntimeError("main() 已禁用，请用 main_v1() 写新版本文件")



def page_c4():
    """C4 系统架构总图 V1.0.9

    关键设计（来自 V1.0.3 用户的"对的版本"）：
    1. 底板 (540, 80) 240x580 浅灰圆角 - 只包"三段+Bus"，不含 SQLite
    2. 目标平台 移位 (1080, 250) → (890, 620)，避免与 ADS Power 同行冲突
    3. Bus 只接"写"：删除 抓→Bus 和 改→Bus 边
    4. 3 条特殊 waypoint 边（V1.0.7 新增）：
       - 抓→源平台: U 形从顶部绕过 + strokeWidth=2 + endArrow=blockThin
       - 写→目标平台: offset waypoint (880, 540)
       - 写→ADS Power: waypoint (810, 490)
    5. 其余 4 列布局、共享资源、API/Worker 等保持 V1.0.3 风格
    """
    reset_ids()
    page_w, page_h = 1400, 900
    out = []

    # ===== 标题 =====
    nid_t, s = node(450, 20, 500, 50, "电商 AI 助手 · 系统架构总图 V1.0.9", STYLE_TITLE)
    out.append(s)

    # ===== 客户端 (3 个) =====
    nid_web, s = node(50, 100, 150, 60, "Web 工作台 (React+Vite+RQ)", STYLE_DEFAULT)
    out.append(s)
    nid_ext, s = node(50, 200, 150, 60, "MV3 浏览器插件 (采集/填表)", STYLE_DEFAULT)
    out.append(s)
    nid_pop, s = node(50, 300, 150, 60, "Popup 快捷入口", STYLE_DEFAULT)
    out.append(s)

    # ===== API + Worker =====
    nid_api, s = node(280, 150, 200, 80, "Hono API /api/v1/* + /v2/*\n+ JWT 鉴权", STYLE_PHASE)
    out.append(s)
    nid_wkr, s = node(280, 280, 200, 80, "Node Worker (LLM/Playwright/图片)", STYLE_PHASE)
    out.append(s)

    # ===== 底板 (V1.0.3 关键设计) =====
    # 浅灰圆角矩形, 包住"三段+Bus"，不含 SQLite
    # V1.0.3 的精确坐标: (540, 80) 240x580
    nid_grp, s = node(540, 80, 240, 580, "",
        "rounded=1;whiteSpace=wrap;html=1;fillColor=#F2F2F2;strokeColor=#BFBFBF;verticalAlign=top;fontFamily=Microsoft YaHei;fontSize=11;fontStyle=1;fontColor=#333333;")
    out.append(s)

    # ===== 三段 Domain (在底板内) =====
    nid_c, s = node(560, 100, 200, 80, "① 抓数据 · Collect\nPOST /collect-jobs", STYLE_PHASE)
    out.append(s)
    nid_p, s = node(560, 250, 200, 80, "② 改写 · Pipeline\nPOST /products/:id/pipeline", STYLE_PHASE)
    out.append(s)
    nid_u, s = node(560, 400, 200, 80, "③ 写数据 · Publish\nPOST /publish-tasks", STYLE_PHASE)
    out.append(s)

    # ===== 数据总线 (在底板内) =====
    nid_bus, s = node(560, 540, 200, 60, "数据总线 productId / locale / templateId / status", STYLE_BUS)
    out.append(s)

    # ===== 共享资源 =====
    nid_shr, s = node(820, 100, 200, 80, "Shared 共享库\nSKU 6 段 / 定价 / 违禁", STYLE_DEFAULT)
    out.append(s)
    nid_tpl, s = node(820, 200, 200, 80, "Templates 8 类目\nA 矩阵 / B 组合 / C 定制", STYLE_DEFAULT)
    out.append(s)
    nid_rul, s = node(820, 300, 200, 80, "Rules 规则库\n倍率/违禁/字数", STYLE_DEFAULT)
    out.append(s)
    nid_ai, s = node(820, 400, 200, 80, "LLM Adapter\n多模型(豆包/GPT-4o)", STYLE_DEFAULT)
    out.append(s)

    # ===== 外部 =====
    nid_src, s = node(1080, 100, 250, 70, "源平台（抓）\n1688/淘宝/拼多多/Shopee/TT", STYLE_EXTERN)
    out.append(s)
    # 目标平台 移位到 (890, 620)，与底板右侧对齐
    nid_dst, s = node(890, 620, 250, 70, "目标平台（写）\nShopee vn/ph/id + TT Shop th", STYLE_EXTERN)
    out.append(s)
    nid_mod, s = node(1080, 400, 250, 70, "LLM Provider\n豆包 / GPT-4o / Claude", STYLE_EXTERN)
    out.append(s)
    nid_ads, s = node(1080, 540, 250, 60, "ADS Power (P2/未实现)\nIP 隔离 / 店群", STYLE_EXTERN)
    out.append(s)

    # ===== SQLite (在底板外, x=280 左侧) =====
    nid_db, s = node(280, 540, 200, 60, "SQLite (better-sqlite3)", STYLE_DATA)
    out.append(s)

    # ===== 边（严格按 V1.0.3 用户的 20 条边）=====
    # 客户端 → API（3 条，V1.0.3 n20/n21/n22 都是 right→left）
    out.append(edge(nid_web, nid_api, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_ext, nid_api, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_pop, nid_api, hint={'src':'right', 'tgt':'left'})[1])

    # API → 三段（3 条）
    out.append(edge(nid_api, nid_c, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_api, nid_p, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_api, nid_u, hint={'src':'right', 'tgt':'left'})[1])

    # Worker → 抓/改（2 条, V1.0.3 n26/n27）
    out.append(edge(nid_wkr, nid_c, "采集Job", hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_wkr, nid_p, "LLM调用", hint={'src':'right', 'tgt':'left'})[1])

    # 写 → Bus（V1.0.3 只有 n9→n10, 不再有 c→bus 和 p→bus）
    out.append(edge(nid_u, nid_bus, hint={'src':'bot', 'tgt':'top'})[1])

    # Bus → SQLite
    out.append(edge(nid_bus, nid_db, hint={'src':'left', 'tgt':'right'})[1])

    # 三段 → 共享资源（6 条: 抓/改/写 → Shared, 改 → Templates/Rules/LLM Adapter）
    out.append(edge(nid_c, nid_shr, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_p, nid_shr, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_u, nid_shr, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_p, nid_tpl, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_p, nid_rul, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_p, nid_ai, hint={'src':'right', 'tgt':'left'})[1])

    # 抓 → 源平台（V1.0.3 是 U 形从顶部绕过 + 粗线方块箭头）
    # V1.0.3 n7→n15 特殊样式: strokeWidth=2;endArrow=blockThin
    # 走法: 抓顶部出 → 向上 → 横跨标题上方 → 源平台顶部入
    # 关键: 需要 sourcePoint/targetPoint 锚点 + 2 个 waypoint 包在 Array 里
    src_special = (
        "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;"
        "html=1;strokeWidth=2;endArrow=blockThin;endFill=1;"
        "fontFamily=Microsoft YaHei;fontSize=10;strokeColor=#333333;"
        "exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;"
    )
    out.append(edge(
        nid_c, nid_src,
        style=src_special,
        waypoints=[
            {'x': 660, 'y': 74},   # 抓正上方
            {'x': 1205, 'y': 74},  # 源平台正上方
        ],
        source_point={'x': 800, 'y': 74},   # 路径起点锚点
        target_point={'x': 1010, 'y': -90}, # 路径终点锚点
        custom=True,
    )[1])

    # 写 → 目标平台（V1.0.3 n39 用 as="offset" 模式 + 1 个 waypoint）
    # exit bot → waypoint (880, 540) → entry left
    out.append(edge(
        nid_u, nid_dst, "写",
        hint={'src': 'bot', 'tgt': 'left'},
        waypoints=[{'x': 880, 'y': 540}],
        as_offset=True,
    )[1])

    # LLM Adapter → LLM Provider
    out.append(edge(nid_ai, nid_mod, hint={'src':'right', 'tgt':'left'})[1])

    # 写 → ADS Power（V1.0.3 n41 用 Array+waypoint，无 offset）
    out.append(edge(
        nid_u, nid_ads, "P2",
        hint={'src': 'right', 'tgt': 'left'},
        waypoints=[{'x': 810, 'y': 490}],
    )[1])

    # 底部说明
    nid_nt, s = node(50, 700, 1300, 80,
                     "三棱镜：A 高频重复→规则引擎(shared/) | B 高频模糊→LLM 异步段 | C 中频→竞品/选品 Job | D 排除→不实现\n"
                     "工程栈：Hono + SQLite + better-sqlite3 + jose(JWT) + bcryptjs + Zod | React 19 + Tailwind v4 + React Query | MV3",
                     STYLE_BUS)
    out.append(s)

    nid_nt2, s = node(50, 800, 1300, 60,
                      "Out of Scope (v2.0 不做): 完整 ERP(订单/仓储/财务)、店群矩阵防关联、多租户计费、学员账号、淘宝作为目标",
                      STYLE_BUS)
    out.append(s)

    return page_w, page_h, out


def page_c10():
    """C10 状态机（3 状态 · 全员可读）"""
    reset_ids()
    page_w, page_h = 1000, 600
    out = []

    nid_t, s = node(300, 20, 400, 40, "状态机 · publish-tasks (API 行为)", STYLE_TITLE)
    out.append(s)

    # 3 状态节点
    nid_pend, s = node(100, 200, 200, 80, "pending\n待发布/待填表", STYLE_PHASE)
    out.append(s)
    nid_comp, s = node(700, 100, 200, 80, "completed\n成功上架", STYLE_PHASE)
    out.append(s)
    nid_fail, s = node(700, 300, 200, 80, "failed\n失败可重试", STYLE_PHASE)
    out.append(s)

    # 触发点
    nid_tr1, s = node(100, 350, 200, 60, "触发：用户点发布\n或插件拉取载荷", STYLE_DEFAULT)
    out.append(s)
    nid_tr2, s = node(700, 200, 200, 60, "DOM 填表完成", STYLE_DEFAULT)
    out.append(s)
    nid_tr3, s = node(700, 400, 200, 60, "超时/选择器失败", STYLE_DEFAULT)
    out.append(s)

    # 边
    out.append(edge(nid_pend, nid_comp, "成功")[1])
    out.append(edge(nid_pend, nid_fail, "失败")[1])
    out.append(edge(nid_pend, nid_tr1)[1])
    out.append(edge(nid_comp, nid_tr2)[1])
    out.append(edge(nid_fail, nid_tr3)[1])

    # 边：失败→重试→pending
    nid_retry, s = node(400, 380, 200, 60, "用户点重试\n(回到 pending)", STYLE_DEFAULT)
    out.append(s)
    out.append(edge(nid_fail, nid_retry, "重试")[1])
    out.append(edge(nid_retry, nid_pend, "→")[1])

    # 底部说明
    nid_nt, s = node(50, 480, 900, 80,
                     "status.ts 还定义 6 状态（含 filling/cancelled），但 API 仅暴露 pending/completed/failed（最新代码事实）\n"
                     "产品状态机（5 套）：Pending/Draft/Reviewing/Live/Suspended（谷歌报告 1 一致）",
                     STYLE_BUS)
    out.append(s)

    return page_w, page_h, out


# ====================================================================
# C2-C12 各页生成器（V1.0.8 新增 9 张：端到端 / 矩阵 / 5 层细节 / API / 部署 / 风险）
# ====================================================================

def page_c2():
    """C2 端到端流程（用户故事 + 三段闭环 · 9 步大块 + 粗箭头）"""
    reset_ids()
    page_w, page_h = 1600, 1000
    out = []

    # 标题
    nid_t, s = node(550, 20, 500, 60, "端到端流程 · 单品上架 9 步", STYLE_TITLE)
    out.append(s)

    # 用户故事
    nid_us, s = node(50, 90, 1500, 60,
                     "用户故事: 运营看到竞品 TOP10 → 选 1 个商品 → 采集入库 → AI 改写 → 自动上架东南亚\n"
                     "目标: 单品 ≤5 分钟（传统 30-60 分钟）",
                     STYLE_BUS)
    out.append(s)

    # 3 泳道：大方块，间距宽
    nid_l1, s = node(50, 170, 180, 100, "用户\n(运营)", STYLE_ACTOR)
    out.append(s)
    nid_l2, s = node(50, 290, 180, 100, "本应用\n(Web/API)", STYLE_PHASE)
    out.append(s)
    nid_l3, s = node(50, 410, 180, 100, "插件\n+Worker", STYLE_PHASE)
    out.append(s)
    nid_l4, s = node(50, 530, 180, 100, "源平台\n+目标平台", STYLE_EXTERN)
    out.append(s)

    # 9 步大方块（高 80, 宽 280, 间距大）
    steps = [
        # (y, lane_idx, title, status)
        (170, 0, "① 看竞品\nTOP10", "✅ P0"),
        (290, 1, "② 提交 URL\n或粘贴链接", "✅ P0"),
        (410, 2, "③ L1/L2/L4\n抓取原始商品", "✅ P0"),
        (530, 3, "④ 入库\n采集箱", "✅ P0"),
        (650, 0, "⑤ 选模板+\n触发管线", "✅ P0"),
        (650, 1, "⑥ 规则+LLM\n改写标题/SKU", "🚧 P0/P1"),
        (650, 2, "⑦ 创建\n发布任务", "✅ P0"),
        (650, 3, "⑧ 填表:\n标题/价/SKU/图", "🚧 P0 仅 1 站"),
        (820, 0, "⑨ 回写\ncompleted", "✅ P0"),
    ]
    step_ids = []
    for i, (y, lane, title, status) in enumerate(steps):
        x = 250 + (i % 9) * 145  # 横向 9 列
        if i >= 5:
            x = 250 + (i - 5) * 145 + 70  # 第二个循环微调
        # 实际简化: 9 步全部横向
        x = 250 + i * 145
        y_actual = 170 + i * 70
        nid_s, s = node(x, y_actual, 140, 65, f"{title}\n[{status}]", STYLE_DEFAULT)
        out.append(s)
        step_ids.append(nid_s)

    # 步骤间箭头（粗 strokeWidth=3）
    for i in range(len(step_ids) - 1):
        out.append(edge(step_ids[i], step_ids[i+1],
                        style="strokeWidth=3;",
                        hint={'src':'right', 'tgt':'left'})[1])

    # 读图说明
    nid_legend, s = node(50, 850, 1500, 60,
                         "泳道说明: 用户(运营) → 本应用(Web/API) → 插件+Worker → 源/目标平台\n"
                         "状态标记: ✅ 已实现 P0  ·  🚧 部分实现  ·  📋 P1 规划中",
                         STYLE_BUS)
    out.append(s)

    # 契约说明
    nid_c, s = node(50, 920, 1500, 60,
                    "数据契约: NormalizedProduct v1.0.0 (COLLECT_SCHEMA.md) — 插件与本应用共用, 改字段需同步 3 处",
                    STYLE_BUS)
    out.append(s)

    return page_w, page_h, out


def page_c3():
    """C3 多对多平台矩阵 · 5 源 × 3 目标 + 完整图例"""
    reset_ids()
    page_w, page_h = 1400, 800
    out = []

    # 标题
    nid_t, s = node(450, 20, 500, 50, "多对多平台矩阵 · 源×目标 适配状态", STYLE_TITLE)
    out.append(s)

    # 顶部图例
    nid_lh, s = node(50, 80, 200, 30, "图例 (必看):", STYLE_PHASE)
    out.append(s)
    nid_l1, s = node(260, 80, 240, 30, "✅ 已支持 (端到端跑通)", STYLE_DATA)
    out.append(s)
    nid_l2, s = node(510, 80, 240, 30, "📋 P1 (规划中, 已设计)", STYLE_PHASE)
    out.append(s)
    nid_l3, s = node(760, 80, 240, 30, "❌ 不做 (Out of Scope)", STYLE_EXTERN)
    out.append(s)

    # 解释说明
    nid_ex, s = node(50, 120, 1300, 40,
                     "读法: 纵轴是源平台 (采集来源), 横轴是目标平台 (上架目的地), 单元格是 适配状态",
                     STYLE_BUS)
    out.append(s)

    # 列头：目标平台
    targets = ["越南 Shopee", "泰国 TikTok", "菲律宾 Shopee"]
    for col, name in enumerate(targets):
        nid_h, s = node(300 + col*330, 180, 300, 50, name, STYLE_PHASE)
        out.append(s)

    # 行头：源平台
    sources = ["淘宝/天猫", "1688", "拼多多", "抖店", "链接直采 (Worker)"]
    for row, name in enumerate(sources):
        nid_h, s = node(50, 250 + row*90, 240, 70, name, STYLE_DEFAULT)
        out.append(s)

    # 矩阵单元 (5×3=15) - 状态来自 REQUIREMENTS_V2.md
    status_grid = [
        # 越南, 泰国, 菲律宾
        ['📋 P1', '📋 P1', '📋 P1'],  # 淘宝
        ['✅', '📋 P1', '✅'],  # 1688
        ['📋 P1', '❌', '📋 P1'],  # 拼多多（反爬强 + 泰国不做）
        ['📋 P1', '✅', '📋 P1'],  # 抖店
        ['✅', '✅', '✅'],  # 链接直采
    ]
    for row in range(5):
        for col in range(3):
            status = status_grid[row][col]
            if '✅' in status:
                color = STYLE_DATA
            elif '📋' in status:
                color = STYLE_PHASE
            else:
                color = STYLE_EXTERN
            # 行说明
            row_note = {
                0: "FR-C-01 P0",
                1: "FR-C-01 P0",
                2: "FR-C-01 P1 (反爬强)",
                3: "FR-C-01 P1",
                4: "FR-C-02 P1",
            }[row]
            nid_m, s = node(300 + col*330, 250 + row*90, 300, 70, f"{status}\n{row_note}", color)
            out.append(s)

    # 底部 OOS 说明
    nid_oos, s = node(50, 720, 1300, 60,
                      "为什么 ❌?  拼多多→泰国 = 平台官方不支持跨境  ·  还有: 淘宝/天猫作为目标发布 (v1 提及, v2 聚焦东南亚)",
                      STYLE_BUS)
    out.append(s)

    return page_w, page_h, out


def page_c5():
    """C5 抓数据(采集层) · 4 阶段 + 实现状态"""
    reset_ids()
    page_w, page_h = 1500, 850
    out = []

    nid_t, s = node(500, 20, 500, 50, "采集层 · Collect 数据流 (本应用 API)", STYLE_TITLE)
    out.append(s)

    # 4 个阶段标题
    stages = ["① 源站采集", "② 提交到本应用", "③ Worker 补全", "④ 入库采集箱"]
    for col, name in enumerate(stages):
        nid_h, s = node(50 + col*360, 100, 340, 50, name, STYLE_PHASE)
        out.append(s)

    # 阶段 1：源站采集
    nid_e1, s = node(50, 180, 160, 100, "MV3 浏览器插件\ncontent script\n[✅ P0]", STYLE_DEFAULT)
    out.append(s)
    nid_e2, s = node(50, 300, 160, 100, "L1 JSON 嵌入\nL2 JSON-LD\n[✅ P0]", STYLE_DEFAULT)
    out.append(s)
    nid_e3, s = node(50, 420, 160, 100, "L4 DOM 兜底\nFallback\n[✅ P0]", STYLE_DEFAULT)
    out.append(s)

    # 阶段 2：提交到本应用 API
    nid_t1, s = node(230, 180, 340, 100, "POST /collect-jobs\nNormalizedProduct v1.0.0\n[✅ P0]", STYLE_DEFAULT)
    out.append(s)
    nid_t2, s = node(230, 300, 340, 100, "POST /collect-jobs/batch\nmaxItems≤20, 250-2400ms\n[📋 P1]", STYLE_DEFAULT)
    out.append(s)
    nid_t3, s = node(230, 420, 340, 100, "POST /collect-jobs/:id/parse\n链接模式补全\n[📋 P1]", STYLE_DEFAULT)
    out.append(s)

    # 阶段 3：Worker 补全
    nid_w1, s = node(590, 180, 340, 100, "Node Worker\nPlaywright/Crawlee\n[📋 P1]", STYLE_PHASE)
    out.append(s)
    nid_w2, s = node(590, 300, 340, 100, "Adapter 站点适配器\nGET /collect-adapters/:site\n[📋 P1]", STYLE_DEFAULT)
    out.append(s)
    nid_w3, s = node(590, 420, 340, 100, "反爬: 限速+Cookie\nENABLE_BATCH_WORKER\n[✅ P0]", STYLE_EXTERN)
    out.append(s)

    # 阶段 4：入库
    nid_d1, s = node(950, 180, 340, 100, "SQLite\nproducts 表\n[✅ P0]", STYLE_DATA)
    out.append(s)
    nid_d2, s = node(950, 300, 340, 100, "采集箱 Web UI\nGET /products\n[✅ P0]", STYLE_DEFAULT)
    out.append(s)
    nid_d3, s = node(950, 420, 340, 100, "状态: raw\n可筛选/搜索\n[✅ P0]", STYLE_DEFAULT)
    out.append(s)

    # 横向流程
    out.append(edge(nid_e1, nid_t1, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_t1, nid_w1, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_w1, nid_d1, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_e2, nid_t1, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_e3, nid_t1, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_t2, nid_w2, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_w2, nid_d1, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_t3, nid_w1, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_d1, nid_d2, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_d2, nid_d3, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_w1, nid_w3, hint={'src':'bot', 'tgt':'top'})[1])

    # 底部说明
    nid_nt, s = node(50, 560, 1400, 100,
                     "契约: NormalizedProduct v1.0.0 (COLLECT_SCHEMA.md) — 插件/Web/API 共用, 改字段 3 处同步\n"
                     "L1/L2/L4 提取策略: JSON 嵌入 → JSON-LD → DOM 兜底\n"
                     "Out of Scope: 拼多多反爬/零封号保证/淘宝/天猫作为目标",
                     STYLE_BUS)
    out.append(s)

    # 实现状态图例
    nid_legend, s = node(50, 700, 1400, 100,
                         "状态标记 (必看): [✅ P0] 端到端跑通  ·  [📋 P1] 规划中, 已设计  ·  [❌ OOS] Out of Scope  ·  [🚧] 部分实现",
                         STYLE_PHASE)
    out.append(s)

    return page_w, page_h, out


def page_c6():
    """C6 改写(处理管线) · 4 段 + 实现状态 + 三棱镜逻辑"""
    reset_ids()
    page_w, page_h = 1500, 900
    out = []

    nid_t, s = node(500, 20, 500, 50, "处理管线 · Pipeline 4 段闭环", STYLE_TITLE)
    out.append(s)

    # 三棱镜原则
    nid_pri, s = node(50, 80, 1400, 50,
                      "三棱镜原则: A 高频重复→规则引擎(shared/)  |  B 高频模糊→LLM 异步  |  C 中频→竞品/选品 Job  |  D 排除→不实现",
                      STYLE_PHASE)
    out.append(s)

    # 输入输出
    nid_in, s = node(50, 180, 220, 130, "输入\nNormalizedProduct\n(raw 采集箱)\n[✅ P0]", STYLE_DATA)
    out.append(s)
    nid_out, s = node(1230, 180, 220, 130, "输出\nProcessedOutput\n(可发布载荷)\n[🚧 P0/P1]", STYLE_DATA)
    out.append(s)

    # 4 个处理段（每段 250×280）
    segs = [
        # (x, title, logic, status, lib)
        (300, "① 规则引擎", "SKU 编码\n价格倍率\n违禁扫描\n图片规则", "✅ P0", "shared/listing/\nskuEncoder\nmarketPricing\nantiBan"),
        (570, "② 类目模板", "8 套模板\nA: 多规格(服装)\nB: 中规格(电器)\nC: 少规格(定制)", "✅ P0", "shared/listing/\ncategoryTemplates"),
        (840, "③ LLM 异步", "标题改写\n多语言翻译\n图片描述\n(Worker)", "📋 P1", "LLM Adapter\n豆包/GPT-4o\nClaude"),
        (1110, "④ 校验输出", "antiBan 检查\nSKU 长度\n图片 5/9 张\n分市场适配", "🚧 P0/P1", "shared/listing/\nlistingValidation"),
    ]
    seg_ids = []
    for x, title, logic, status, lib in segs:
        nid_t1, s = node(x, 160, 250, 50, f"{title}  [{status}]", STYLE_PHASE)
        out.append(s)
        nid_l, s = node(x, 230, 250, 100, logic, STYLE_DEFAULT)
        out.append(s)
        nid_lib, s = node(x, 350, 250, 80, f"代码:\n{lib}", STYLE_BUS)
        out.append(s)
        # 用一个虚拟节点串起来（用于连线）
        seg_ids.append(nid_l)

    # 输入→seg1, seg1→seg2→seg3→seg4, seg4→输出
    out.append(edge(nid_in, seg_ids[0], hint={'src':'right', 'tgt':'left'})[1])
    for i in range(3):
        out.append(edge(seg_ids[i], seg_ids[i+1])[1])
    out.append(edge(seg_ids[3], nid_out, hint={'src':'right', 'tgt':'left'})[1])

    # 共享资源层（底部）
    nid_sh, s = node(50, 470, 450, 80, "shared/listing/ (本应用代码库)\n规则+模板+定价+校验+PIPELINE.md", STYLE_BUS)
    out.append(s)
    nid_llm, s = node(520, 470, 450, 80, "LLM Adapter (P1 规划)\n多模型异步, 成本监控", STYLE_BUS)
    out.append(s)
    nid_v, s = node(990, 470, 450, 80, "校验库\nP0: 基础  ·  P1: 完整 antiBan", STYLE_BUS)
    out.append(s)

    for seg in seg_ids:
        out.append(edge(seg, nid_sh, hint={'src':'bot', 'tgt':'top'})[1])
    out.append(edge(seg_ids[2], nid_llm, hint={'src':'bot', 'tgt':'top'})[1])
    out.append(edge(seg_ids[3], nid_v, hint={'src':'bot', 'tgt':'top'})[1])

    # 状态
    nid_st, s = node(50, 590, 1400, 70,
                     "PipelineRun.status: pending → running → completed | failed\n"
                     "POST /products/:id/pipeline-runs  ·  GET /pipeline-runs/:id",
                     STYLE_DEFAULT)
    out.append(s)

    # 实现路径说明
    nid_road, s = node(50, 700, 1400, 100,
                       "实现路径: shared/pipeline/engine.ts (主流程) + shared/listing/* (纯函数库) + LLM Adapter (Worker)\n"
                       "P0 必通: 1 站真填表 (越南 Shopee)  ·  P1 完整: 3 站 + LLM 标题优化 7 步 (TITLE_OPTIMIZATION_REQUIREMENTS.md)",
                       STYLE_BUS)
    out.append(s)

    # 状态图例
    nid_legend, s = node(50, 820, 1400, 60,
                         "状态标记: [✅ P0] 已实现  ·  [📋 P1] 规划中  ·  [🚧 P0/P1] 部分实现 (P0 基础, P1 完整)  ·  [❌] 不做",
                         STYLE_PHASE)
    out.append(s)

    return page_w, page_h, out


def page_c7():
    """C7 写数据(发布层) · 用户故事 + 4 阶段"""
    reset_ids()
    page_w, page_h = 1500, 900
    out = []

    nid_t, s = node(500, 20, 500, 50, "发布层 · Publish 填表流程", STYLE_TITLE)
    out.append(s)

    # 用户入口 + 用户故事
    nid_entry, s = node(50, 80, 1400, 60,
                        "用户入口: 工作台 → 采集箱 → 选商品 → [创建发布任务] 按钮  (用户故事: 已处理完的商品一键上架)",
                        STYLE_PHASE)
    out.append(s)

    # 4 列
    cols = ["① 用户在工作台", "② 本应用 API", "③ 插件填表", "④ 状态回写"]
    for col, name in enumerate(cols):
        nid_h, s = node(50 + col*360, 160, 340, 50, name, STYLE_PHASE)
        out.append(s)

    # 阶段 1: 用户
    nid_u1, s = node(50, 230, 340, 90, "选商品 (来自采集箱)\n选目标平台 (3 选 1)\n选 模板/规则 [✅ P0]", STYLE_DEFAULT)
    out.append(s)
    nid_u2, s = node(50, 340, 340, 90, "点 [创建发布任务]\n前端 → POST /publish-tasks\n[✅ P0]", STYLE_DEFAULT)
    out.append(s)

    # 阶段 2: 本应用 API
    nid_a1, s = node(410, 230, 340, 90, "POST /publish-tasks\n写库 (status=draft)\n返回 task.id [✅ P0]", STYLE_DEFAULT)
    out.append(s)
    nid_a2, s = node(410, 340, 340, 90, "状态变更: draft→pending\n触发插件拉取\n[🚧 P0 越南/P1 全]", STYLE_DEFAULT)
    out.append(s)

    # 阶段 3: 插件填表
    nid_p1, s = node(770, 230, 340, 90, "插件轮询 GET /publish-tasks\nGET /extension/selectors\n[✅ P0]", STYLE_DEFAULT)
    out.append(s)
    nid_p2, s = node(770, 340, 340, 90, "打开目标卖家后台\n填: 标题/价/SKU/图\n[🚧 P0 越南/P1 全]", STYLE_EXTERN)
    out.append(s)

    # 阶段 4: 状态回写
    nid_s1, s = node(1130, 230, 340, 90, "PATCH /publish-tasks/:id\nstatus=filling→completed\n[✅ P0]", STYLE_DEFAULT)
    out.append(s)
    nid_s2, s = node(1130, 340, 340, 90, "失败: 写 reason\nseletor_miss/timeout\n可重试 [✅ P0]", STYLE_DEFAULT)
    out.append(s)

    # 横向流程
    out.append(edge(nid_u1, nid_a1, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_a1, nid_p1, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_p1, nid_s1, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_u2, nid_a2, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_a2, nid_p2, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_p2, nid_s2, hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_u1, nid_u2, hint={'src':'bot', 'tgt':'top'})[1])
    out.append(edge(nid_a1, nid_a2, hint={'src':'bot', 'tgt':'top'})[1])
    out.append(edge(nid_p1, nid_p2, hint={'src':'bot', 'tgt':'top'})[1])
    out.append(edge(nid_s1, nid_s2, hint={'src':'bot', 'tgt':'top'})[1])

    # 失败重试环（用户主动重试）
    nid_re, s = node(770, 460, 340, 70, "失败 → 用户点 [重试]  → 回到 pending\n(用户主动操作, 不自动)", STYLE_PHASE)
    out.append(s)
    out.append(edge(nid_s2, nid_re, hint={'src':'bot', 'tgt':'right'})[1])

    # 关键校验
    nid_v, s = node(50, 570, 1400, 110,
                    "干跑校验 (P1): POST /publish-tasks/:id/validate — 不写库, 只返回错误\n"
                    "批量编码: POST /products/:id/sku/encode — 按模板批量生成 skuCode\n"
                    "代码库: shared/listing/antiBan.ts + skuEncoder.ts + marketPricing.ts",
                    STYLE_BUS)
    out.append(s)

    # P2 扩展
    nid_p2, s = node(50, 720, 1400, 90,
                     "P2 规划: TikTok Open API 授权  ·  ADS Power 指纹环境  ·  Redis 短链  ·  计费 hooks",
                     STYLE_BUS)
    out.append(s)

    # 状态图例
    nid_legend, s = node(50, 830, 1400, 50,
                         "状态: [✅ P0] 已实现  ·  [🚧] P0 仅 1 站 (越南)  ·  [📋 P1] 全 3 站",
                         STYLE_PHASE)
    out.append(s)

    return page_w, page_h, out


def page_c8():
    """C8 数据模型+6段SKU · 7 实体（每个标注作用）+ 6 段 SKU"""
    reset_ids()
    page_w, page_h = 1500, 1000
    out = []

    nid_t, s = node(500, 20, 500, 50, "数据模型 + 6 段 SKU 结构", STYLE_TITLE)
    out.append(s)

    # 7 个实体（每个加"作用"说明）
    entities = [
        (50, 100, "users",
         "用户表\n运营/管理员账号\n存 bcrypt 哈希"),
        (380, 100, "products",
         "商品表 (核心)\n存 rawCapture 快照\nstatus: 4 态"),
        (710, 100, "collect_jobs",
         "采集任务表\nNormalizedProduct 原始\nstatus: 4 态"),
        (1040, 100, "pipeline_runs",
         "处理管线运行表\n存 ProcessedOutput\nstatus: 4 态"),
        (50, 350, "publish_tasks",
         "发布任务表\n存 listing 载荷\nstatus: 6 态"),
        (380, 350, "rule_sets",
         "规则集表\n价格公式/截断\n可绑定到管线"),
        (710, 350, "category_templates",
         "类目模板表\n8 套 (A/B/C)\nSKU 模式 + 定价"),
    ]
    ent_ids = []
    for x, y, name, desc in entities:
        nid_n, s = node(x, y, 280, 50, name, STYLE_DATA)
        out.append(s)
        nid_d, s = node(x, y+60, 280, 80, desc, STYLE_DEFAULT)
        out.append(s)
        ent_ids.append((nid_n, nid_d))

    # 实体关系（基于节点名）
    # products ← collect_jobs (1:N), products ← pipeline_runs (1:N), products ← publish_tasks (1:N)
    out.append(edge(ent_ids[2][0], ent_ids[1][0], "1:N", hint={'src':'left', 'tgt':'right'})[1])
    out.append(edge(ent_ids[3][0], ent_ids[1][0], "1:N", hint={'src':'left', 'tgt':'right'})[1])
    out.append(edge(ent_ids[4][0], ent_ids[1][0], "1:N", hint={'src':'left', 'tgt':'top'})[1])
    # pipeline_runs ← rule_sets (N:1)
    out.append(edge(ent_ids[3][0], ent_ids[5][0], "N:1", hint={'src':'bot', 'tgt':'top'})[1])
    # pipeline_runs ← category_templates (N:1)
    out.append(edge(ent_ids[3][0], ent_ids[6][0], "N:1", hint={'src':'bot', 'tgt':'top'})[1])

    # 6 段 SKU 结构标题
    nid_sk, s = node(50, 540, 1400, 50, "6 段 SKU 结构: PREFIX-SEQ-SIDE-COLOR-SIZE-(+B|+H)", STYLE_TITLE)
    out.append(s)

    segs = [
        (50, "PREFIX", "类目前缀\n例 BF=童装"),
        (290, "SEQ", "3 位序号\n001-999"),
        (530, "SIDE", "P=正面\nR=反面\nPR=双面"),
        (770, "COLOR", "颜色码\nWH/BK/PK"),
        (1010, "SIZE", "尺码\n110cm/120cm"),
        (1250, "后缀", "+B=印花\n+H=热转印"),
    ]
    seg_ids = []
    for x, name, desc in segs:
        nid_n, s = node(x, 620, 200, 40, name, STYLE_PHASE)
        out.append(s)
        nid_d, s = node(x, 680, 200, 60, desc, STYLE_DEFAULT)
        out.append(s)
        seg_ids.append(nid_n)

    # 段间箭头
    for i in range(len(seg_ids) - 1):
        out.append(edge(seg_ids[i], seg_ids[i+1], "-", hint={'src':'right', 'tgt':'left'})[1])

    # White Hook 例子
    nid_wh, s = node(50, 770, 1400, 50,
                     "White Hook (诱饵) 例子: BF-9999-P-WH-110   (价 400 / 库存 5 / 重 220g — 防平台 0 销量降权)",
                     STYLE_BUS)
    out.append(s)

    # 关键字段
    nid_f1, s = node(50, 840, 450, 80, "products.status (采集箱)\nraw | processing\nready | published", STYLE_DEFAULT)
    out.append(s)
    nid_f2, s = node(520, 840, 450, 80, "publish_tasks.status (后端)\ndraft | pending | filling\ncompleted | failed | cancelled", STYLE_DEFAULT)
    out.append(s)
    nid_f3, s = node(990, 840, 460, 80, "ListingStatus (UI 映射)\npending | draft | reviewing\nlive | suspended", STYLE_DEFAULT)
    out.append(s)

    # 数据流箭头
    out.append(edge(nid_f1, nid_f2, "→", hint={'src':'right', 'tgt':'left'})[1])
    out.append(edge(nid_f2, nid_f3, "→", hint={'src':'right', 'tgt':'left'})[1])

    # 状态图例
    nid_legend, s = node(50, 940, 1400, 40,
                         "为什么 3 套状态?  后端存原始 6 态 (含 filling)  ·  UI 简化 5 态 (无 filling)  ·  采集箱 4 态 (不含 draft)",
                         STYLE_PHASE)
    out.append(s)

    return page_w, page_h, out


def page_c9():
    """C9 API 总图 · 7 域 + 业务作用注释"""
    reset_ids()
    page_w, page_h = 1500, 1000
    out = []

    nid_t, s = node(500, 20, 500, 50, "API 总图 · REST /api/v1/*", STYLE_TITLE)
    out.append(s)

    # 顶部说明
    nid_top, s = node(50, 80, 1400, 50,
                      "全部 26 端点 · 项目经理/业务看作用 · 研发看路径 · 包络: { code, message, data }",
                      STYLE_PHASE)
    out.append(s)

    # 7 域：每个域 1 标题 + 1 业务作用 + 端点列表
    domains = [
        (50, "Auth 认证", "登录/换 Token\nJWT (jose) 鉴权", ["POST /auth/login", "POST /auth/refresh", "GET /auth/me"]),
        (300, "Collect 采集", "插件/Worker\n提交原始商品", ["POST /collect-jobs", "POST /collect-jobs/batch", "GET /collect-jobs", "GET /collect-jobs/:id", "POST /collect-jobs/:id/parse", "GET /collect-adapters/:site"]),
        (550, "Products 商品", "采集箱 CRUD\n筛选/搜索/详情", ["GET /products", "GET /products/:id", "PATCH /products/:id", "DELETE /products/:id"]),
        (800, "Pipeline 管线", "触发处理\n查运行状态", ["POST /products/:id/pipeline-runs", "GET /pipeline-runs/:id", "GET /products/:id/pipeline-runs"]),
        (1050, "Insights 洞察", "选品/竞品分析\n(P1 规划)", ["POST /products/:id/insights/competitors", "POST /products/:id/insights/keywords", "GET /insights/:jobId"]),
        (1300, "Publish 发布", "创建/查/改\n发布任务", ["POST /publish-tasks", "GET /publish-tasks", "PATCH /publish-tasks/:id", "POST /publish-tasks/:id/validate", "POST /products/:id/sku/encode"]),
        (50, "Extension 插件", "插件认证\n+ 选择器热更新", ["POST /extension/token", "GET /extension/selectors"]),
    ]

    for x, name, role, eps in domains:
        # 域头
        nid_h, s = node(x, 150, 220, 40, name, STYLE_PHASE)
        out.append(s)
        # 业务作用
        nid_r, s = node(x, 200, 220, 60, role, STYLE_BUS)
        out.append(s)
        # 端点列表
        for i, ep in enumerate(eps):
            y = 280 + i * 45
            nid_e, s = node(x, y, 220, 38, ep, STYLE_DEFAULT)
            out.append(s)
            out.append(edge(nid_h, nid_e, hint={'src':'bot', 'tgt':'top'})[1])

    # 底部包络
    nid_env, s = node(50, 700, 1400, 100,
                      "响应包络: { \"code\": 0, \"message\": \"ok\", \"data\": T }   ·  code≠0 表示业务错误\n"
                      "鉴权: JWT (jose) + bcryptjs  ·  校验: Zod  ·  插件短期 Token: POST /extension/token",
                      STYLE_PHASE)
    out.append(s)

    # 状态/计划
    nid_p, s = node(50, 820, 1400, 100,
                    "P0 已实现: Auth + Collect (单品) + Products CRUD + Publish (越南 1 站)\n"
                    "P1 规划: Collect batch + Insights + validate 干跑 + 3 站填表\n"
                    "P2 规划: /link-catcher + /integrations + /billing",
                    STYLE_BUS)
    out.append(s)

    return page_w, page_h, out


def page_c11():
    """C11 部署与环境 · 本机/网络 + 4 环境 + 数据流"""
    reset_ids()
    page_w, page_h = 1500, 1000
    out = []

    nid_t, s = node(500, 20, 500, 50, "部署与环境 · 本机 vs 网络 + 4 环境", STYLE_TITLE)
    out.append(s)

    # 3 组件（顶部）
    nid_ch, s = node(50, 80, 1400, 40, "① 3 个组件 (代码 3 仓)", STYLE_PHASE)
    out.append(s)
    comps = [
        (50, "web/", "React 19 + Vite + RQ\nTailwind v4  ·  SPA 静态"),
        (520, "api/", "Hono + SQLite\nbetter-sqlite3  ·  Node 20+ / Docker"),
        (990, "extension/", "MV3 Chrome\ncontent script  ·  Popup"),
    ]
    comp_ids = []
    for x, name, sub in comps:
        nid_c, s = node(x, 130, 460, 100, f"{name}\n{sub}", STYLE_PHASE)
        out.append(s)
        comp_ids.append(nid_c)

    # ============ 本机 vs 网络部署 ============
    nid_dh, s = node(50, 250, 1400, 40, "② 两种部署方式 (互斥, 选 1)", STYLE_PHASE)
    out.append(s)

    # 本机
    nid_lh, s = node(50, 300, 690, 40, "本机部署 (Local / 演示用)", STYLE_PHASE)
    out.append(s)
    nid_lc, s = node(50, 350, 690, 180,
                     "步骤:\n"
                     "  1. cd api && npm install && npm run dev  (终端 1)\n"
                     "  2. cd web && npm install && npm run dev  (终端 2, Vite 代理 /api/v1 → :8080)\n"
                     "  3. 或 docker compose up --build (一键)\n"
                     "  4. 访问 http://localhost:3004  ·  登录 admin01/abcd234\n"
                     "特点: 数据存本地 SQLite, 插件指向 localhost",
                     STYLE_DEFAULT)
    out.append(s)

    # 网络
    nid_nh, s = node(760, 300, 690, 40, "网络部署 (生产 / 公网)", STYLE_PHASE)
    out.append(s)
    nid_nc, s = node(760, 350, 690, 180,
                     "步骤:\n"
                     "  1. web: GitHub Actions → Cloudflare Pages (自动)\n"
                     "  2. api: Node 20+ 或 Docker 镜像 (api/Dockerfile 含 Chromium)\n"
                     "  3. extension: npm run zip:extension → Chrome Web Store\n"
                     "  4. 配置 GitHub Secrets: VITE_API_URL, JWT_SECRET\n"
                     "特点: Web 全球 CDN, API Node 服务, 插件商店分发",
                     STYLE_DEFAULT)
    out.append(s)

    # ============ 4 个环境 ============
    nid_eh, s = node(50, 550, 1400, 40, "③ 4 个环境 (同一套代码, 不同配置)", STYLE_PHASE)
    out.append(s)
    envs = [
        (50, "local", "本机开发\nnpm run dev\nSQLite 文件", "✅"),
        (380, "dev", "开发服务器\n共享 DB\n功能联调", "✅"),
        (710, "staging", "预发布\n全功能跑\n客户验收", "📋"),
        (1040, "prod", "生产\nCloudflare Pages\n+ Node/Docker", "✅"),
    ]
    env_ids = []
    for x, name, desc, status in envs:
        nid_n, s = node(x, 600, 310, 40, f"{name}  [{status}]", STYLE_PHASE)
        out.append(s)
        nid_d, s = node(x, 650, 310, 80, desc, STYLE_DEFAULT)
        out.append(s)
        env_ids.append(nid_n)

    # ============ 数据流 + 环境变量 ============
    nid_fh, s = node(50, 750, 1400, 40, "④ 数据流 + 环境变量", STYLE_PHASE)
    out.append(s)
    nid_f1, s = node(50, 800, 1400, 50,
                     "数据流: Web (CF Pages) → HTTPS → API (Node) → SQLite    ·    插件 → API (with Token) → SQLite",
                     STYLE_BUS)
    out.append(s)
    nid_f2, s = node(50, 870, 1400, 80,
                     "API 必填: JWT_SECRET  ·  可选: DATABASE_PATH, PORT, ENABLE_BATCH_WORKER, BATCH_WORKER_SIMULATE\n"
                     "Web 可选: VITE_API_URL, VITE_FORCE_LOCAL_API  ·  插件: API 地址 + 插件令牌",
                     STYLE_BUS)
    out.append(s)

    return page_w, page_h, out


def page_c12():
    """C12 风险+ADR 决策 · 详细 ADR + 风险展开 + ERP 边界"""
    reset_ids()
    page_w, page_h = 1500, 1100
    out = []

    nid_t, s = node(500, 20, 500, 50, "风险 + ADR 决策 (Architecture Decision Record)", STYLE_TITLE)
    out.append(s)

    # ADR 解释
    nid_exp, s = node(50, 80, 1400, 50,
                      "ADR = Architecture Decision Record (架构决策记录)  ·  记录\"为什么这样做\", 后续 review 不再争论",
                      STYLE_PHASE)
    out.append(s)

    # 5 ADR（详细版）
    nid_ah, s = node(50, 140, 1400, 40, "5 大 ADR 决策 (含 Why / Status)", STYLE_PHASE)
    out.append(s)
    adrs = [
        # (title, why, status)
        ("ADR-1 三层架构: 抓/改/写 分段",
         "Why: 单端 monolithic 难以独立扩展, 插件/Worker/API 各自演进\nStatus: ✅ 已落地 (C4 总图)"),
        ("ADR-2 契约: NormalizedProduct v1.0.0",
         "Why: 插件/Web/API 共用同一份 JSON, 改字段 3 处同步 (COLLECT_SCHEMA.md)\nStatus: ✅ 已落地 (v1.0.0 冻结)"),
        ("ADR-3 状态机: 双轨",
         "Why: 后端 6 态完整, UI 简化为 5 态, 采集箱 4 态 — 各角色只关心自己要看的\nStatus: ✅ 已落地 (C8)"),
        ("ADR-4 分市场: VN/TH/PH",
         "Why: 越南 x3.5 倍率, 泰国 x2.5, 菲律宾固定 500 PHP — 一份代码分市场配置\nStatus: ✅ P0 越南 / 📋 P1 全"),
        ("ADR-5 工具定位: 不做 ERP",
         "Why: ERP 涉及订单/仓储/财务, 复杂度指数级增长; 本项目专注\"商品上架\"这一段\nStatus: ✅ 明确边界 (见下)"),
    ]
    adr_ids = []
    for i, (title, why) in enumerate(adrs):
        nid_t, s = node(50, 200 + i*90, 380, 40, title, STYLE_PHASE)
        out.append(s)
        nid_w, s = node(440, 200 + i*90, 1010, 80, why, STYLE_DEFAULT)
        out.append(s)
        adr_ids.append(nid_t)
        out.append(edge(nid_ah, nid_t, hint={'src':'bot', 'tgt':'top'})[1])

    # 6 风险 + 缓解 + 状态
    nid_rh, s = node(50, 660, 1400, 40, "6 大风险 (含 风险是什么 / 缓解措施 / 状态)", STYLE_PHASE)
    out.append(s)
    risks = [
        # (what, mitigation, status)
        ("R-1 平台反爬/封号\n(淘宝/拼多多主动检测)",
         "缓解: 限速 250-2400ms + 用户自有 Cookie + 单次操作随机延迟\n状态: ✅ P0 已实施"),
        ("R-2 选品模板覆盖不全\n(类目太多, 8 套不够)",
         "缓解: A/B/C 三类兜底, 持续累积, 通用规则库\n状态: ✅ P0 8 套 / 📋 P1 扩展"),
        ("R-3 LLM 标题质量\n(各平台字数/违禁词差异)",
         "缓解: 7 步流程 (采集→生成→对比→更换) + 人工确认\n状态: 📋 P1"),
        ("R-4 DOM 选择器失效\n(目标平台改版)",
         "缓解: 热更新 API (GET /extension/selectors) + selector_miss 错误码\n状态: ✅ P0"),
        ("R-5 多店/防关联\n(店群矩阵)",
         "缓解: 预留 ADS Power 集成 (P2)  ·  v2 不实现\n状态: 📋 P2 规划"),
        ("R-6 计费/多租户\n(LLM token 成本)",
         "缓解: P2 钩子 (/billing/hooks)  ·  v2 不做学员账号\n状态: 📋 P2 规划"),
    ]
    for i, (what, mit) in enumerate(risks):
        nid_w, s = node(50, 720 + i*55, 380, 50, what, STYLE_BUS)
        out.append(s)
        nid_m, s = node(440, 720 + i*55, 1010, 50, mit, STYLE_DEFAULT)
        out.append(s)
        out.append(edge(nid_rh, nid_w, hint={'src':'bot', 'tgt':'top'})[1])

    # ERP 边界
    nid_erp, s = node(50, 1060, 1400, 30,
                      "ERP 边界 (硬约束): 本项目 = 简单实用的商品上架工具, 不做订单/仓储/财务/多店防关联",
                      STYLE_PHASE)
    out.append(s)

    return page_w, page_h, out


def main_v1():
    p1w, p1h, p1nodes = page_c1()
    p2w, p2h, p2nodes = page_c2()
    p3w, p3h, p3nodes = page_c3()
    p4w, p4h, p4nodes = page_c4()
    p5w, p5h, p5nodes = page_c5()
    p6w, p6h, p6nodes = page_c6()
    p7w, p7h, p7nodes = page_c7()
    p8w, p8h, p8nodes = page_c8()
    p9w, p9h, p9nodes = page_c9()
    p10w, p10h, p10nodes = page_c10()
    p11w, p11h, p11nodes = page_c11()
    p12w, p12h, p12nodes = page_c12()

    diag_c1 = build_diagram(1, "C1-业务全景", p1w, p1h, p1nodes)
    diag_c2 = build_diagram(2, "C2-端到端流程", p2w, p2h, p2nodes)
    diag_c3 = build_diagram(3, "C3-多对多平台矩阵", p3w, p3h, p3nodes)
    diag_c4 = build_diagram(4, "C4-系统架构总图", p4w, p4h, p4nodes)
    diag_c5 = build_diagram(5, "C5-抓数据(采集层)", p5w, p5h, p5nodes)
    diag_c6 = build_diagram(6, "C6-改写(处理管线)", p6w, p6h, p6nodes)
    diag_c7 = build_diagram(7, "C7-写数据(发布层)", p7w, p7h, p7nodes)
    diag_c8 = build_diagram(8, "C8-数据模型+6段SKU", p8w, p8h, p8nodes)
    diag_c9 = build_diagram(9, "C9-API总图", p9w, p9h, p9nodes)
    diag_c10 = build_diagram(10, "C10-状态机", p10w, p10h, p10nodes)
    diag_c11 = build_diagram(11, "C11-部署与环境", p11w, p11h, p11nodes)
    diag_c12 = build_diagram(12, "C12-风险+ADR决策", p12w, p12h, p12nodes)

    xml = f'''<mxfile host="app.diagrams.net" type="device">
  {diag_c1}
  {diag_c2}
  {diag_c3}
  {diag_c4}
  {diag_c5}
  {diag_c6}
  {diag_c7}
  {diag_c8}
  {diag_c9}
  {diag_c10}
  {diag_c11}
  {diag_c12}
</mxfile>
'''

    # 验证：12 张图、ID 唯一
    ids = re.findall(r'<diagram id="(diag-[^"]+)"', xml)
    assert len(ids) == 12, f"应有 12 张图，实际 {len(ids)} 张"
    assert len(set(ids)) == len(ids), f"图 ID 重复: {[i for i in ids if ids.count(i)>1]}"
    print(f"  [校验] 12 张图 ID 唯一")


    DST.write_text(xml, encoding="utf-8")
    # 安全检查：绝不能写入历史基线
    forbidden = {
        "架构图深层重新分析V1.0.0.drawio",
        "架构图深层重新分析V1.0.3.drawio",
        "架构图深层重新分析V1.0.4.drawio",
        "架构图深层重新分析V1.0.5.drawio",
        "架构图深层重新分析V1.0.6.drawio",
        "架构图深层重新分析V1.0.7.drawio",
        "架构图深层重新分析V1.0.8.drawio",
    }
    if DST.name in forbidden:
        raise RuntimeError(f"拒绝覆盖历史基线 {DST.name}！改 DST 路径。")
    print(f"[V1.0.9] {DST.name}")
    print(f"  C1: {len(p1nodes)} cells, page {p1w}x{p1h}")
    print(f"  C2: {len(p2nodes)} cells, page {p2w}x{p2h}")
    print(f"  C3: {len(p3nodes)} cells, page {p3w}x{p3h}")
    print(f"  C4: {len(p4nodes)} cells, page {p4w}x{p4h}")
    print(f"  C5: {len(p5nodes)} cells, page {p5w}x{p5h}")
    print(f"  C6: {len(p6nodes)} cells, page {p6w}x{p6h}")
    print(f"  C7: {len(p7nodes)} cells, page {p7w}x{p7h}")
    print(f"  C8: {len(p8nodes)} cells, page {p8w}x{p8h}")
    print(f"  C9: {len(p9nodes)} cells, page {p9w}x{p9h}")
    print(f"  C10: {len(p10nodes)} cells, page {p10w}x{p10h}")
    print(f"  C11: {len(p11nodes)} cells, page {p11w}x{p11h}")
    print(f"  C12: {len(p12nodes)} cells, page {p12w}x{p12h}")
    print(f"  Total: 12 real (no placeholder)")
    print(f"  Total size: {DST.stat().st_size:,} bytes")


if __name__ == "__main__":
    main_v1()
