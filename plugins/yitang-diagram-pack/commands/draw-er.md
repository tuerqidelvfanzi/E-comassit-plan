---
description: "画 ER 图（实体关系图）。Mermaid 草图 → drawio 交付。"
---

# 斜杠命令：/draw-er

## 行为

激活 `diagram-generator` skill，走 **T4 ER 图模板**。

## 参数

- 主题（如："电商 ER"、"用户域 ER"）
- 实体列表
- 关系类型（1:1 / 1:N / N:M）
- 版本号

## 流程

1. 列出实体及其属性
2. 明确关系（基数）
3. Mermaid `erDiagram` 草图
4. 转 drawio（实体三段式：标题/属性）
5. 校验 + 落盘

## 输出路径

`docs/diagrams/er/<主题>ERV<版本>.drawio`
