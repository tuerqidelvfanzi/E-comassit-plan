# 前端技术栈参考

## 技术栈分层

基础层：

- React：组件模型。
- TypeScript：类型约束。
- Vite：开发服务器与生产构建。

样式层：

- Tailwind CSS v4：原子样式与构建集成。
- CSS Variables：主题与设计令牌。
- shadcn/radix：可组合的基础组件风格。
- lucide-react：统一图标。
- framer-motion：需要时处理过渡与布局动画。

数据层：

- Axios：统一 HTTP client。
- React Query：服务端状态、缓存、重试、失效。
- Zustand：客户端状态与会话状态。
- OpenAPI 工具：生成类型或客户端。

工程层：

- Customer/Admin 双应用入口。
- UI Playground。
- 浏览器验收门禁。
- Agent Skills 与工作流。

## 强推荐复用

- React + TypeScript + Vite。
- Tailwind v4 + CSS Variables。
- shadcn/radix 组件体系。
- React Query 管服务端状态。
- Zustand 管客户端状态。
- Axios 统一请求层。
- UI 组件库 + Playground。
- 浏览器级验收。

## 按项目选择

- Customer/Admin 双应用。如果没有管理端，可以先只启用 customer。
- View/Panel 网格架构。如果页面很轻，可以简化成 View/Section。
- React Table / React Virtual。如果没有大表格或长列表，可以延后引入。
- OpenAI / Google GenAI SDK。如果目标项目没有 AI 能力，不要安装。
- Docker + nginx。如果部署平台已有静态托管能力，可以改用平台原生配置。

## 不建议复用

- 任何已有项目的业务模块名。
- 任何已有项目的 API 资源。
- 任何已有项目的业务 Store。
- 任何已有项目的页面文案、路由、权限、计费、任务流。

## 选型理由

React + Vite 适合 Agent 协作，因为文件边界清晰、启动快、错误反馈直接。

React Query 与 Zustand 分开，是为了避免把远端数据和本地 UI 状态混成一个难以追踪的数据桶。

Tailwind + CSS Variables 适合搭建一致的设计系统，也方便 Agent 在不破坏主题的前提下扩展组件。

Playground 让组件的真实用法留在代码里，减少 Agent 依赖口头记忆。
