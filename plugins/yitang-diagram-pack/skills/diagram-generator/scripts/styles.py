"""drawio 样式常量（与项目现有 build_deep_v100.py 风格保持一致）。"""
from __future__ import annotations

# 节点样式
STYLE_DEFAULT = "rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;"
STYLE_TITLE   = "rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=14;fontStyle=1;"
STYLE_PHASE   = "rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=13;fontStyle=1;"
STYLE_ACTOR   = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#f8cecc;strokeColor=#b85450;"
STYLE_DATA    = "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#e1d5e7;strokeColor=#9673a6;"
STYLE_BUS     = "rounded=0;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;fontSize=12;fontStyle=3;"
STYLE_EXTERN  = "rounded=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;dashed=1;fontSize=11;"

# 决策/特殊形状
STYLE_DECISION = "shape=rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=12;"
STYLE_TERMINATOR = "shape=mxgraph.flowchart.terminator;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=12;"
STYLE_PREPARATION = "shape=mxgraph.flowchart.preparation;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=12;"

# 容器/子图
STYLE_CONTAINER = "rounded=0;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;dashed=1;verticalAlign=top;fontStyle=1;align=center;"

# 边样式
EDGE_DEFAULT = "endArrow=classic;html=1;"
EDGE_DASHED  = "endArrow=classic;html=1;dashed=1;"
EDGE_BOLD    = "endArrow=classic;html=1;strokeWidth=3;"
EDGE_BIDIR   = "endArrow=classic;startArrow=classic;html=1;"
EDGE_NONE    = "endArrow=none;html=1;"


def style_with(value: str, base: str) -> str:
    """在 base style 上追加自定义 value（仅用于调试）。"""
    return base + f"labelBackgroundColor=#ffffff;"


def get_node_style(kind: str) -> str:
    """按类别获取节点样式。kind ∈ {default, title, phase, actor, data, bus, extern, decision, terminator, preparation}"""
    return {
        "default": STYLE_DEFAULT,
        "title": STYLE_TITLE,
        "phase": STYLE_PHASE,
        "actor": STYLE_ACTOR,
        "data": STYLE_DATA,
        "bus": STYLE_BUS,
        "extern": STYLE_EXTERN,
        "decision": STYLE_DECISION,
        "terminator": STYLE_TERMINATOR,
        "preparation": STYLE_PREPARATION,
    }.get(kind, STYLE_DEFAULT)


def get_edge_style(kind: str) -> str:
    """按类别获取边样式。kind ∈ {default, dashed, bold, bidir, none}"""
    return {
        "default": EDGE_DEFAULT,
        "dashed": EDGE_DASHED,
        "bold": EDGE_BOLD,
        "bidir": EDGE_BIDIR,
        "none": EDGE_NONE,
    }.get(kind, EDGE_DEFAULT)
