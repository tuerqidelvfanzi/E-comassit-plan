---
description: "画系统架构图 / C4 图。Mermaid 草图 → drawio 交付。"
---

# 斜杠命令：/draw-architecture

## 行为

激活 `diagram-generator` skill，走 **T2 系统架构图 / C4 Container 模板**。

## 参数

- 主题（如："电商助手架构图"）
- C4 层级（Context / Container / Component / Deployment）
- 版本号（默认 V1.0.0）

## 流程

1. 询问 C4 层级（默认 Container）
2. 列出主要组件（前端、后端、数据库、第三方服务）
3. Mermaid 草图
4. 转 drawio
5. 校验 + 落盘

## 输出路径

`docs/architecture-diagrams/<主题>V<版本>.drawio`
