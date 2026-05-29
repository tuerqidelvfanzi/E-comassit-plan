# 前端技术栈通用参考包

这个目录不是业务模板，也不是当前项目的复制件。它是从一个已落地的 SaaS/工作台型前端工程中抽象出的通用技术参考，供其他全新项目组或 Agent 复用。

## 适用场景

- SaaS 后台、运营工作台、数据看板、业务管理系统。
- 需要同时维护用户端与管理端。
- 需要列表、详情、抽屉、弹窗、面板、长耗时任务、权限和 REST API。
- 希望由 Agent 持续参与开发、重构、验收和文档维护。

## 不适用场景

- 纯营销落地页。
- 内容很少的静态官网。
- 强游戏、强 3D、强实时协同编辑类产品。
- 不需要 React 技术栈的项目。

## 内容

- `agent-execution.md`：给 Agent 的通用执行指南。
- `docs/frontend-stack-reference.md`：技术栈说明与选型边界。
- `docs/frontend-architecture-reference.md`：目录、路由、View/Panel、状态和 API 架构参考。
- `docs/agent-collaboration-reference.md`：Agent 协作、验收和 Git/SemVer 治理参考。
- `configs/`：可复制后本地化的配置模板。
- `skills/`：可选迁移的 Agent Skills / Workflows / shadcn 规则包。

## 使用原则

先复用技术方法，再按目标项目重建业务模型。

必须替换：

- 业务模块名称。
- API 资源名称。
- 页面和面板内容。
- 权限、登录、计费、任务流等业务规则。
- 部署域名、端口、后端服务名和环境变量。

可以复用：

- React + TypeScript + Vite 工程基座。
- Tailwind v4 + shadcn + CSS Variables 设计系统。
- React Query + Zustand + Axios 的职责拆分。
- Customer / Admin 双应用入口。
- View + Panel 分层。
- UI 组件库 + Playground 机制。
- 浏览器级验收门禁。
- Agent Skills 与工作流治理思路。
