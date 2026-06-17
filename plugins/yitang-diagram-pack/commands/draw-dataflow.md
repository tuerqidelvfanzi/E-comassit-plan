---
description: "画数据流图（DFD）。Mermaid 草图 → drawio 交付。"
---

# 斜杠命令：/draw-dataflow

## 行为

激活 `diagram-generator` skill，走 **T1 数据流图模板**（见 `skills/diagram-generator/templates.md#T1`）。

## 参数（自动从用户消息中提取）

- 主题/对象（如："下单流程"、"登录流程"）
- 版本号（默认 V1.0.0，历史存在则自增）
- 范围（Level 0 / Level 1 / Level 2）

## 流程

1. 与用户确认范围（涉及哪些外部实体、哪些处理、哪些数据存储）
2. 内部用 Mermaid 草图
3. 询问结构 OK 吗
4. 转 drawio
5. 校验 + 落盘 + CHANGELOG

## 输出路径

`docs/architecture-diagrams/<主题>数据流图V<版本>.drawio`
