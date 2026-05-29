---
name: version-standard
description: "通用版本一致性与发布可追溯模板。用于前后端协作、部署和发布前记录版本、Git SHA、构建时间和接口契约。"
---

# 版本一致性与发布可追溯模板

> 这是通用模板，不绑定任何具体仓库。目标项目使用前必须替换仓库名、版本号规则、部署环境和验收命令。

## 1. 目标

发布或联调时，保证以下信息可追踪：

- Web 版本。
- Server 版本。
- Web Git SHA。
- Server Git SHA。
- 构建时间。
- API 契约版本。
- 数据库迁移状态。
- 本次发布功能范围。

## 2. 推荐版本信息

前端可暴露：

- `VITE_APP_VERSION`
- `VITE_GIT_SHA`
- `VITE_BUILD_TIME`
- `VITE_API_VERSION`

后端可暴露：

- `/health`
- `/version`
- `/api/v1/version`

## 3. 联调前检查

Agent 或开发者应确认：

- 当前前端分支和 SHA。
- 当前后端分支和 SHA。
- API 契约是否匹配。
- 本地数据库 schema 是否兼容后端版本。
- 前端代理目标是否指向正确后端。

## 4. 发布前检查

至少记录：

```text
Web: <version> <sha>
Server: <version> <sha>
API: <version>
Build Time: <timestamp>
Environment: <dev/staging/prod>
```

## 5. 失败归因

遇到验收失败，先区分：

- 前端代码问题。
- 后端代码问题。
- API 契约不一致。
- 数据库迁移缺失。
- 部署环境漂移。
- 外部服务故障。

不要在未确认版本组合的情况下把问题归因给某一端。
