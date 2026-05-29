# 电商助手项目 — Agent 入口

## 目录约定

| 路径 | 用途 |
|------|------|
| `frontend-stack-reference-pack/` | **只读参考**：技术栈、架构、Vite 模板、Git/Skills，不直接改业务 |
| `docs/` | 本项目规划、架构、API、插件规范 |
| `web/` | B 站 Web 应用（React + Vite，对齐参考包） |
| `extension/` | 浏览器插件（Manifest V3） |

## 开发原则

1. 先读 `docs/PROJECT_PLAN.md` 与 `docs/ARCHITECTURE.md` 再改代码。
2. **插件与 Web 采集数据**以 `docs/COLLECT_SCHEMA.md` 为唯一契约；改字段须同步插件、`web/src/lib/collectTypes.ts` 与 `shared/schemas/normalized-product.schema.json`。
3. 双人协作：`docs/TASK_ASSIGNMENT.md`（A 插件 / B Web）、`docs/DEV_SPLIT.md`；关联代码搜索 `COLLECT_SCHEMA` 或 `@coupling`。
4. **多智能体指代**：对外会话使用 **Scope-A**（`extension/`）与 **Scope-B**（`web/`），见 `docs/AGENT_SCOPE.md` 复制提示词模板。
2. Web 工程遵循 `frontend-stack-reference-pack/agent-execution.md`：View 编排、Panel 承载业务、React Query 管服务端数据。
3. 业务与参考包解耦：不复制参考包中的业务模块名/API。
4. 前端验收须浏览器实开页面，不能仅凭 `vite` 终端输出。

## 参考原型

- 线上 UI 参考：https://psa-b6i.pages.dev/（商品选品助手）
- 会议结论白板：见 `docs/PROJECT_PLAN.md` 附录
