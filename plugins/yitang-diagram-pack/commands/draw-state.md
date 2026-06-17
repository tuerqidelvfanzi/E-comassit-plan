---
description: "画状态机图（State Machine）。Mermaid 草图 → drawio 交付。"
---

# 斜杠命令：/draw-state

## 行为

激活 `diagram-generator` skill，走 **T5 状态机模板**。

## 参数

- 主题（如："订单状态机"、"工单状态机"）
- 状态列表
- 转换事件
- 版本号

## 流程

1. 列出所有状态（含初始/终止）
2. 列出转换事件
3. Mermaid `stateDiagram-v2` 草图
4. 转 drawio
5. 校验 + 落盘

## 输出路径

`docs/diagrams/state/<主题>状态机V<版本>.drawio`
