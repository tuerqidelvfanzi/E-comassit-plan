# 前端架构参考

## 应用边界

推荐把用户端和管理端拆成两个入口：

```text
apps/customer
apps/admin
```

它们可以共享根级 `src/components`、`src/lib`、`src/stores`，也可以在更严格的项目里各自独立。新项目一开始就要定清楚共享边界。

## 目录职责

`components/ui`：

- 业务无关组件。
- Button、Input、Select、Dialog、DataTable、Badge 等。

`components/layout`：

- 应用壳、导航、侧边栏、顶部栏、网格布局。

`views`：

- 路由对应的页面编排层。
- 不直接写远端请求。

`panels`：

- 业务功能单元。
- 可以发请求、处理表单、维护局部交互。

`stores`：

- 客户端状态。
- 类型和状态切片要清晰。

`lib`：

- API client、工具函数、格式化函数。

`api`：

- OpenAPI 类型、接口描述、生成结果。

## 路由建议

Customer：

- `/`：公开页或入口页。
- `/login`：登录页。
- `/app/*`：登录后业务应用。

Admin：

- 独立端口或独立域名。
- 根路径就是后台入口。
- 后台路由独立维护，不和 customer 混在同一棵路由树里。

## View/Panel 规则

View 负责“放哪里”。

Panel 负责“做什么”。

跨 Panel 通信用 store 或 query cache，不靠 View 层层传递 props。

## 状态规则

React local state：

- 单组件内部展示状态。

Zustand session store：

- 会话级 UI 状态。

Zustand global store：

- 跨页面共享的客户端业务状态。

React Query：

- 服务端数据唯一入口。

## API 规则

所有接口先设计资源：

```text
GET    /api/v1/resources
POST   /api/v1/resources
GET    /api/v1/resources/:id
PATCH  /api/v1/resources/:id
DELETE /api/v1/resources/:id
```

复杂动作可以作为子资源或命令式边界：

```text
POST /api/v1/resources/:id/publish
```

但不要滥用动词端点。

## 组件规则

已有通用组件能覆盖时，业务代码必须复用。

缺少通用组件时：

1. 先写组件设计说明。
2. 明确 Props、状态、交互、无障碍要求。
3. 得到确认后放入 `components/ui`。
4. 增加 Playground。
5. 再回业务页面使用。
