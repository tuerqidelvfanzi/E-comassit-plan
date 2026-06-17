---
description: "画时序图（Sequence Diagram）。Mermaid 草图 → drawio 交付。"
---

# 斜杠命令：/draw-sequence

## 行为

激活 `diagram-generator` skill，走 **T3 时序图模板**。

## 参数

- 主题（如："下单时序"、"登录时序"）
- 参与者列表
- 版本号

## 流程

1. 确认参与者
2. 列出消息（顺序、类型、是否异步）
3. Mermaid `sequenceDiagram` 草图
4. 转 drawio（参与者顶部对齐，消息线为虚线竖直箭头）
5. 校验 + 落盘

## 输出路径

`docs/diagrams/sequence/<主题>时序图V<版本>.drawio`
