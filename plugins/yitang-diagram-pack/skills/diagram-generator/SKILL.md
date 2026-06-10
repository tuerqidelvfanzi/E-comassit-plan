---
name: diagram-generator
description: "项目用图生成器。当用户需要数据流图、架构图、时序图、ER图、状态机、流程图、C4模型、类图、部署图等任何可视化图表时自动触发。**Mermaid 作为内部思考与讨论格式，最终交付物必须为 drawio XML**（用户要求纯 Mermaid 输出时例外）。生成的 drawio 必须兼容 app.diagrams.net，可被用户手动编辑后回灌迭代。"
allowed-tools: Read,Write,Edit,Bash,Glob,Grep
---

# 项目用图生成器 (Diagram Generator)

## 🎯 核心交付原则（铁律）

> **Mermaid 是过程，drawio 才是产物。**

| 阶段 | 格式 | 目的 | 落盘 |
|------|------|------|------|
| 1. 理解需求 | 自然语言 | 与用户对齐 | ❌ 不落盘 |
| 2. 内部草图 | **Mermaid** | 快速构图、git diff | 仅写入对话，可选落 `.md` |
| 3. 正式交付 | **drawio XML** | 人类精修、客户展示 | ✅ 必落盘 |
| 4. 迭代 | 用户改 drawio → 描述变更 | Claude 重建 | ✅ 新版本号 |

> ⚠️ **用户明确说"只要 Mermaid"** 时才不转 drawio，否则一律走 drawio。

## 触发场景

触发关键词（任一命中即激活）：
- "画 / 生成 / 出" + "图/架构/流程/时序/状态/ER/部署"
- "数据流图 / DFD / C4 / 架构图 / 部署图 / 时序图 / 状态机 / 流程图 / ER 图 / 类图"
- "把这段代码逻辑画出来"
- "现有架构图不清楚，重画"
- "升级 V1.0.x"

## 工作流（必须按顺序走）

```
Step 1: 明确图类型与对象
  ↓
Step 2: Mermaid 草图（对话内完成，不一定要落盘）
  ↓
Step 3: 转换为 drawio XML（套用 references/conversion-rules.md 规则）
  ↓
Step 4: 校验（scripts/drawio_validate.py）
  ↓
Step 5: 落盘到 docs/architecture-diagrams/<name>V<ver>.drawio
  ↓
Step 6: 更新 CHANGELOG，版本号自增
```

## Step 1: 明确图类型

| 类别 | 类型 | 选哪个模板 |
|------|------|----------|
| **结构** | 系统架构图、C4 Context/Container/Component、部署图 | `templates.md#架构图` |
| **流向** | 数据流图(DFD)、业务流程图、调用链路图 | `templates.md#数据流图` |
| **行为** | 时序图、活动图、状态机 | `templates.md#时序图` / `状态机` |
| **数据** | ER 图、类图、数据库 Schema | `templates.md#ER图` / `类图` |
| **用户** | 用户旅程、用例图 | `templates.md#流程图` 改编 |

## Step 2: Mermaid 草图

**先在对话内**用 Mermaid 表达结构，**等用户确认结构**后再转 drawio。

> 参考 `references/mermaid-syntax.md`

要点：
- 节点命名必须**与最终 drawio 节点 ID 同名**（便于一一映射）
- 边标签用动词短语（"调用"、"读写"、"回调"）
- 子图用 `subgraph` 划分边界

## Step 3: 转换为 drawio XML（最关键）

参考 `references/conversion-rules.md`，**核心规则**：

| Mermaid | drawio |
|---------|--------|
| `A[矩形]` | `rounded=1;whiteSpace=wrap;html=1;` + `<mxCell vertex="1">` |
| `A([体育场])` | `shape=mxgraph.flowchart.terminator` |
| `A[(数据库)]` | `shape=cylinder3` |
| `A{菱形}` | `shape=rhombus` |
| `A --> B` | `<mxCell edge="1">` + `endArrow=classic` |
| `A -.-> B` | `endArrow=classic;dashed=1` |
| `A ==> B` | `endArrow=classic;strokeWidth=3` |
| `A -->\|label\| B` | `value="label"` + `labelBackgroundColor=#fff` |
| `subgraph X` | 父级 `<mxCell container="1">` |
| `classDef danger` | 在节点上直接写 `fillColor=#f88` |

**坐标布局规则**（无自动布局，必须手算）：
- 横向布局：节点 `x` 递增 200，`y` 同列对齐
- 纵向布局：节点 `y` 递增 120，`x` 同列对齐
- 子图 `container` 包含所有子节点的几何并集 + 20 像素边距

**样式常量**（来自 [scripts/build_deep_v100.py](scripts/build_deep_v100.py) 第 47-53 行）：

```python
STYLE_DEFAULT = "rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;"
STYLE_TITLE   = "rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=14;fontStyle=1;"
STYLE_PHASE   = "rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=13;fontStyle=1;"
STYLE_ACTOR   = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#f8cecc;strokeColor=#b85450;"
STYLE_DATA    = "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#e1d5e7;strokeColor=#9673a6;"
STYLE_BUS     = "rounded=0;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;fontSize=12;fontStyle=3;"
STYLE_EXTERN  = "rounded=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;dashed=1;fontSize=11;"
```

> 见 [scripts/styles.py](scripts/styles.py) 完整定义。

## Step 4: 校验

```bash
python scripts/drawio_validate.py docs/architecture-diagrams/<name>V<ver>.drawio
```

校验项：
- ✅ XML 格式合法（能解析）
- ✅ 包含 `<mxfile>` → `<diagram>` → `<mxGraphModel>` → `<root>` 骨架
- ✅ 所有 `source`/`target` 引用的 ID 存在
- ✅ 节点 `value` 非空（除匿名占位）
- ⚠️ 警告：孤岛节点（无入边无出边）

## Step 5: 落盘

**目录规范**：
- 主架构图：`docs/architecture-diagrams/<主题>V<版本>.drawio`
- 模块级图：`docs/architecture-diagrams/modules/<模块名>V<版本>.drawio`
- 时序/ER 等专项：`docs/diagrams/<类型>/<对象>V<版本>.drawio`

**命名规范**：
- 中文主题：`电商助手架构图V1.0.0.drawio`
- 英文主题：`auth-flowV1.0.0.drawio`
- 版本号：自 V1.0.0 起，**绝不覆盖**历史版本

## Step 6: CHANGELOG 同步

每次新增版本必须在 `docs/architecture-diagrams/CHANGELOG-<主题>.md` 追加：

```markdown
## V1.0.x (YYYY-MM-DD)
- ✅ 新增/调整：[节点/边列表]
- ⚠️ 删减：[如有，需写明设计依据]
- 📋 状态：[草图/评审中/已确认]
```

## 重要约束

> 见 [.claude/design-preservation.md](.claude/design-preservation.md) 铁律

- ✅ 历史版本节点、边、样式必须保留
- ⚠️ 任何删减必须先与用户确认意图
- ✅ 新增内容**追加**而非替换
- ❌ 不得"简化"已有图（除非用户明确要求）

## 辅助脚本清单

| 脚本 | 用途 |
|------|------|
| `scripts/drawio_validate.py` | XML 校验 + 引用完整性检查 |
| `scripts/mermaid_to_svg.py` | Mermaid → SVG（仅用于 README 预览） |
| `scripts/styles.py` | 统一样式常量（避免散落） |
| `scripts/extract_mermaid.py` | 从 .md 抽取 mermaid 代码块 |

## 详细参考资料

| 文件 | 用途 |
|------|------|
| [references.md](references.md) | Mermaid / drawio / 转换规则全集 |
| [templates.md](templates.md) | 9 类图模板（每类含 Mermaid + drawio） |
| [examples.md](examples.md) | 完整端到端示例 |

## 触发后行为（自动）

激活本 skill 后，Claude 应**立即**：
1. 在对话里先输出 Mermaid 草图
2. 询问："结构 OK 吗？确认后我转 drawio"
3. 用户确认后，按 `references.md#conversion-rules` 转 drawio
4. 自动落盘 + 更新 CHANGELOG
