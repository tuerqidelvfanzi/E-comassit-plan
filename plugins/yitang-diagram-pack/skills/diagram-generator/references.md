# 参考资料手册

本文档包含三部分：
1. **Mermaid 语法速查**（过程用）
2. **drawio XML 关键节点**（交付用）
3. **Mermaid → drawio 转换规则**（核心）

---

## 1. Mermaid 语法速查（过程用）

### 关键字
| 关键字 | 用途 | 走向 |
|--------|------|------|
| `flowchart TB/LR/TD/RL` | 流程图 | Top-Bottom / Left-Right 等 |
| `sequenceDiagram` | 时序图 | 时间从上到下 |
| `classDiagram` | 类图 | — |
| `stateDiagram-v2` | 状态机 | — |
| `erDiagram` | ER 图 | — |
| `journey` | 用户旅程 | — |
| `gantt` | 甘特图 | — |
| `pie` | 饼图 | — |
| `gitGraph` | Git 分支 | — |

### 节点形状（flowchart）
- `A[矩形]` 普通节点
- `A(圆角)`
- `A([体育场])` 终止/起点
- `A[[子流程]]`
- `A{菱形}` 决策
- `A{{六边形}}` 准备
- `A[(圆柱)]` 数据存储
- `A((圆形))` 双向连接
- `A>不对称]` 标签型

### 箭头
- `A --> B` 实线带箭头
- `A --- B` 实线无箭头
- `A -->|标签| B` 带文字
- `A -.-> B` 虚线
- `A ==> B` 加粗
- `A ~~~ B` 无形
- `A --文字--- B` 中间带文字

### 子图
```
subgraph 名称[显示文本]
    A --> B
end
```

### 样式
```
classDef danger fill:#f88,stroke:#800
classDef ok fill:#8f8,stroke:#080
A:::danger
```

### 与 drawio 命名对齐（关键）
> **Mermaid 节点 ID 必须用人类可读英文/中文名**，便于 1:1 映射到 drawio。
> 避免用 `id1`、`n2` 这种无语义 ID。

---

## 2. drawio XML 关键节点（交付用）

### 最小骨架
```xml
<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2026-06-04T00:00:00.000Z" agent="claude-code" version="24.0.0">
  <diagram name="页面名" id="唯一ID">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <!-- 你的节点和边 -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### 节点（vertex）
```xml
<mxCell id="node1" value="API 网关" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;"
        vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="120" height="60" as="geometry"/>
</mxCell>
```

### 边（edge）
```xml
<mxCell id="edge1" value="HTTPS" style="endArrow=classic;html=1;labelBackgroundColor=#ffffff;"
        edge="1" parent="1" source="node1" target="node2">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

### 容器（container / subgraph）
```xml
<mxCell id="group1" value="Web 前端" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;dashed=1;verticalAlign=top;fontStyle=1;"
        vertex="1" connectable="0" parent="1">
  <mxGeometry x="40" y="40" width="600" height="200" as="geometry"/>
</mxCell>
<!-- 子节点 parent="group1" -->
```

### 常用样式（与 scripts/styles.py 同步）

| 名称 | style 字符串 |
|------|-------------|
| DEFAULT | `rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;` |
| TITLE   | `rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=14;fontStyle=1;` |
| PHASE   | `rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=13;fontStyle=1;` |
| ACTOR   | `shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#f8cecc;strokeColor=#b85450;` |
| DATA    | `shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#e1d5e7;strokeColor=#9673a6;` |
| BUS     | `rounded=0;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;fontSize=12;fontStyle=3;` |
| EXTERN  | `rounded=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;dashed=1;fontSize=11;` |

### 形状映射（shape=...）
| drawio shape | 用途 |
|--------------|------|
| `rounded=1` | 圆角矩形（默认） |
| `shape=cylinder3` | 圆柱（数据库） |
| `shape=rhombus` | 菱形（决策） |
| `shape=umlActor` | 角色（火柴人） |
| `shape=cloud` | 云（外部服务） |
| `shape=mxgraph.flowchart.terminator` | 体育场（起止） |
| `shape=mxgraph.flowchart.preparation` | 六边形（准备） |
| `shape=mxgraph.aws4.*` | AWS 图标（需 resourcebus） |

---

## 3. Mermaid → drawio 转换规则（核心）

### 3.1 节点映射表

| Mermaid | drawio style | drawio shape | 备注 |
|---------|--------------|--------------|------|
| `A[文本]` | `STYLE_DEFAULT` | 默认 | 圆角矩形 |
| `A(文本)` | `STYLE_DEFAULT` | 圆角矩形 | 与 [文本] 视觉一致 |
| `A([文本])` | `shape=mxgraph.flowchart.terminator;...` | 体育场 | 起止点 |
| `A[[文本]]` | `shape=mxgraph.flowchart.preparation;...` | 六边形 | 子流程 |
| `A{文本}` | `shape=rhombus;whiteSpace=wrap;html=1;` | 菱形 | 决策 |
| `A[(文本)]` | `STYLE_DATA` | 圆柱 | 数据库 |
| `A((文本))` | `ellipse;whiteSpace=wrap;html=1;` | 椭圆 | 双向 |
| `A>文本]` | `shape=card;whiteSpace=wrap;html=1;` | 卡片 | 标签 |

### 3.2 边映射表

| Mermaid | drawio edge style | 备注 |
|---------|-------------------|------|
| `A --> B` | `endArrow=classic;html=1;` | 实线箭头 |
| `A --- B` | `endArrow=none;html=1;` | 实线无箭头 |
| `A -->\|label\| B` | `value="label";labelBackgroundColor=#ffffff;` | 边标签 |
| `A -.-> B` | `endArrow=classic;dashed=1;` | 虚线 |
| `A ==> B` | `endArrow=classic;strokeWidth=3;` | 加粗 |
| `A ~~~ B` | `endArrow=none;dashed=1;` | 隐形 |
| `A --x B` | `endArrow=classic;startArrow=classic;` | 双向 |

### 3.3 子图映射

Mermaid:
```
subgraph Web[Web 前端]
    A --> B
end
```

drawio:
```xml
<!-- 1. 创建 container 节点 -->
<mxCell id="subgraph_Web" value="Web 前端"
        style="rounded=0;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;dashed=1;verticalAlign=top;fontStyle=1;align=center;"
        vertex="1" connectable="0" parent="1">
  <mxGeometry x="40" y="40" width="600" height="200" as="geometry"/>
</mxCell>
<!-- 2. 子节点 parent 改为 "subgraph_Web" -->
<mxCell id="A" value="A" parent="subgraph_Web" ...>...</mxCell>
<mxCell id="B" value="B" parent="subgraph_Web" ...>...</mxCell>
```

### 3.4 布局算法（无自动布局，必须手算）

#### 横向布局（flowchart LR）
- 同层节点：`x` 步长 200，`y` 一致
- 不同层：`x` 步长 200，`y` 步长 120
- 起点：`x=40, y=40`
- 子图 padding：四周 +20 像素

#### 纵向布局（flowchart TB）
- 同层节点：`y` 步长 120，`x` 一致
- 不同层：`y` 步长 120，`x` 步长 200
- 起点：`x=40, y=40`

#### 多列布局（如 4 列架构图）
- 列宽 280，列间距 40
- 行高 120，行间距 30
- 见 [scripts/build_deep_v100.py](../../../../scripts/build_deep_v100.py) 第 200+ 行

### 3.5 端口指定（避免边穿过不相关节点）

```xml
<mxCell id="edge1" style="endArrow=classic;exitX=1;exitY=0.5;entryX=0;entryY=0.5;"
        edge="1" parent="1" source="A" target="B">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

- `exitX/Y`：源节点出口（0=左, 1=右, 0.5=中）
- `entryX/Y`：目标节点入口

### 3.6 命名规范

- 节点 ID：**Mermaid 中用什么，drawio 中也用什么**（保持一致）
- 边 ID：`<source>_to_<target>` 或 `e_<序号>`
- 子图 ID：`subgraph_<name>`
- 容器：`group_<name>`

### 3.7 校验清单（落盘前必过）

- [ ] 所有 `source` / `target` 引用的 ID 都存在
- [ ] 节点 `value` 不为空
- [ ] 容器 `parent` 指向子节点
- [ ] 边 `value` 文字与 Mermaid 一致
- [ ] 文件名带版本号 `V<major>.<minor>.<patch>`
- [ ] 在 `CHANGELOG-<主题>.md` 追加记录
- [ ] 用 `scripts/drawio_validate.py` 校验通过
