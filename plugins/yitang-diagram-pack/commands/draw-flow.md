---
description: "画业务流程图（Flowchart）。Mermaid 草图 → drawio 交付。"
---

# 斜杠命令：/draw-flow

## 行为

激活 `diagram-generator` skill，走 **T6 业务流程图模板**（也支持 T7 部署图、T8 类图、T9 旅程图，按需切换）。

## 参数

- 主题
- 起止 + 主要步骤
- 决策点
- 版本号

## 流程

1. 列出步骤（含异常分支）
2. 明确决策点
3. Mermaid `flowchart` 草图
4. 转 drawio
5. 校验 + 落盘

## 输出路径

`docs/diagrams/flow/<主题>流程图V<版本>.drawio`
