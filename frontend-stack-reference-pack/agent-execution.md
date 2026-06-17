# 面向 Agent 的通用前端复现指南

## 1. 你的任务

你要在一个全新项目中复现一套通用前端工程能力，而不是复制任何已有业务。

目标是搭出一个可长期演进的工程底座：

- 双应用入口：用户端 `customer` 与管理端 `admin`。
- 类型安全：React + TypeScript。
- 构建：Vite。
- 样式：Tailwind CSS v4 + CSS Variables。
- UI：shadcn/radix 风格组件、lucide 图标、组件 Playground。
- 远端数据：React Query。
- 本地状态：Zustand。
- HTTP 层：Axios 封装。
- 协作：Agent 可读的规范、Skills、验收门禁。

## 2. 先做判断

不要默认完整照搬双应用结构。先判断目标项目属于哪种形态：

- 只有一个前台应用：只启用 `apps/customer`。
- 有后台管理：启用 `apps/customer` 和 `apps/admin`。
- 多租户或多品牌：保留双应用结构，并在路由、主题和部署层本地化。
- 轻量官网：不建议使用完整 View/Panel 架构。

## 3. 推荐技术栈

基础：

- `react`
- `react-dom`
- `typescript`
- `vite`
- `@vitejs/plugin-react`

样式与 UI：

- `tailwindcss`
- `@tailwindcss/vite`
- `tw-animate-css`
- `shadcn`
- `radix-ui`
- `lucide-react`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `framer-motion`
- `sonner`

数据与状态：

- `@tanstack/react-query`
- `@tanstack/react-table`
- `@tanstack/react-virtual`
- `zustand`
- `axios`
- `openapi-fetch`
- `openapi-typescript`

内容渲染，可按需选择：

- `react-markdown`
- `remark-gfm`
- `rehype-raw`

AI 能力，可按需选择：

- `openai`
- `@google/genai`

验收：

- `playwright`
- `tsx`

## 4. 推荐目录结构

```text
apps/
├── customer/
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       └── App.tsx
└── admin/
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── auth/
        ├── api/
        ├── pages/
        └── shell/

src/
├── api/
│   └── v1/openapi.d.ts
├── components/
│   ├── layout/
│   └── ui/
├── hooks/
├── lib/
│   ├── api.ts
│   └── utils.ts
├── pages/
├── panels/
│   ├── shared/
│   └── <business-domain>/
├── stores/
│   ├── globalStore.ts
│   ├── sessionStore.ts
│   ├── authStore.ts
│   └── types.ts
├── views/
│   ├── ui/
│   └── <business-domain>/
└── styles/
```

规则：

- `pages/` 只做路由入口，不写业务逻辑。
- `views/` 只做布局编排，不直接发 API 请求。
- `panels/` 承载业务逻辑、远端请求和局部交互。
- `components/ui/` 放业务无关的通用组件。
- `components/layout/` 放应用布局、导航、网格容器。

## 5. Vite 双应用

建议保留两个配置模板：

- `vite.customer.config.ts`
- `vite.admin.config.ts`

共同要求：

- 使用 `@vitejs/plugin-react`。
- 使用 `@tailwindcss/vite`。
- 通过 `VITE_PROXY_TARGET` 代理 `/api/v1`。
- 通过 `VITE_BASE_PATH` 支持生产路径前缀。
- customer 与 admin 使用不同 `cacheDir` 和 `outDir`。

参考模板在 `configs/`。

## 6. View + Panel 架构

通用关系：

```text
Route -> View -> Panel
```

View：

- 一个路由通常对应一个 View。
- View 负责组合 Panel 和声明布局。
- View 不处理 API 细节。

Panel：

- 一个 Panel 是一个可独立理解的业务单元。
- Panel 负责查询、变更、表单、列表、详情、抽屉等业务交互。
- Panel 可以用 `PanelShell` 包裹，获得统一标题、操作区、全屏、尺寸上下文。

当目标项目不需要复杂面板时，可以降级为：

```text
Route -> Page/View -> Section
```

不要为了形式强行引入网格和面板。

## 7. 状态分层

组件本地状态：

- 单组件内部开关、hover、临时输入。

`sessionStore`：

- 本次浏览器会话有效的 UI 状态。
- 例如面板展开、抽屉草稿、临时过滤条件。

`globalStore`：

- 跨页面共享、可持久化的业务状态。
- 使用 Zustand `persist` 时必须限制持久化字段。

React Query：

- 所有服务端数据。
- 列表、详情、分页、搜索、远端任务状态都交给 React Query。
- mutation 成功后失效相关 query。

红线：

- 不要把远端接口结果复制进 Zustand 当缓存。
- 不要用 Context 做全局数据桶。
- 不要让 View 层承担业务数据编排。

## 8. HTTP 和 API

建议提供统一 `src/lib/api.ts`：

- Axios 实例。
- Token 注入。
- 业务错误与 HTTP 错误统一转换。
- 401、403、404、409、422、429、5xx 有明确处理。
- 支持超时。
- 支持由环境变量切换真实 API base URL 或 Vite proxy。

REST 约定：

- 资源名词复数：`/api/v1/users`。
- 禁止 RPC 风格：不要 `/getUsers`、`/createUser`。
- 查询、过滤、排序、分页走 query string。
- HTTP status 必须表达协议层结果。
- 业务响应 envelope 必须在代码和文档里统一，例如 `{ code, message, data }`。

## 9. UI 与设计系统

设计系统建议：

- Tailwind v4。
- CSS Variables 作为设计令牌。
- shadcn/radix 作为基础组件风格。
- lucide 作为图标库。
- `cn()` 统一合并 `clsx` 与 `tailwind-merge`。

通用组件优先级：

- 先查 `components/ui/`。
- 已有组件能覆盖时，不在业务面板里临时造轮子。
- 缺组件时，先设计 Props 和交互边界，再进入通用组件库。

建议每个通用组件都有 Playground：

```text
src/views/ui/ButtonPlaygroundView.tsx
src/views/ui/InputPlaygroundView.tsx
src/views/ui/SelectPlaygroundView.tsx
src/views/ui/DataTablePlaygroundView.tsx
```

Playground 是给人和 Agent 看的活文档。

## 10. 验收门禁

Agent 不允许只凭终端输出宣布完成。

最小验收：

1. 启动目标前端服务。
2. 用真实浏览器打开目标 URL。
3. 确认首屏有可见内容。
4. 检查 Console 没有阻塞渲染错误。
5. 至少操作一次本次修改涉及的页面。
6. 留下截图、a11y snapshot 或控制台记录。

常见误判：

- Vite ready 不等于页面可用。
- HTTP 200 不等于 React 已渲染。
- 首页能打开不等于目标业务页能用。
- 当前前端新、后端旧时，接口错误可能是环境漂移。

## 11. Skills 迁移

`skills/` 下的内容是可选参考，不是强制复制件。

建议迁移：

- `skills/skills/git-standard`
- `skills/skills/version-standard`
- `skills/workflows`
- `skills/shadcn`

迁移后必须本地化：

- 分支策略。
- 语言策略。
- 发布流程。
- 版本号规则。
- 组件库规则。
- 目标项目的真实验收命令。

## 12. 禁止照搬

不要复制任何现成业务域名、业务页面、业务接口或业务 Store。

目标项目必须自己定义：

- 业务模块。
- 数据模型。
- API resources。
- 权限模型。
- 用户旅程。
- 页面信息架构。
- 部署拓扑。

## 13. 最小交付

目标 Agent 完成技术底座复现后，至少应交付：

- `package.json`。
- `vite.customer.config.ts`，如需要后台则还有 `vite.admin.config.ts`。
- `components.json`。
- Tailwind v4 样式入口与设计 token。
- `src/lib/api.ts`。
- `src/lib/utils.ts`。
- Zustand store 示例。
- React Query Provider。
- 至少一个通用 UI 组件。
- 至少一个 UI Playground。
- 至少一个目标项目自己的业务 View/Panel 示例。
- 目标项目版本的前端协议。
- 类型检查和浏览器验收证据。
