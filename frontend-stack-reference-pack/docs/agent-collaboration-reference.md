# Agent 协作参考

## 基本原则

Agent 要先理解目标项目，而不是复制参考项目。

每次开始前先确认：

- 当前分支。
- 当前工作树是否干净。
- 目标任务属于文档、前端、后端、环境还是发布。
- 是否需要独立分支或 worktree。

## 文档优先级

建议目标项目维护：

- `AGENTS.md`：Agent 入口规则。
- `docs/FRONTEND_PROTOCOL.md`：前端开发协议。
- `.agents/skills/`：可加载技能。
- `.agents/workflows/`：常用工作流。

## Git 参考

可采用：

- `main`：生产。
- `develop`：集成。
- `feature/*`：功能。
- `hotfix/*`：紧急修复。

提交信息建议使用 Conventional Commits。

目标团队如果已有流程，以目标团队流程为准，不要直接覆盖。

## 验收参考

前端任务至少需要：

- 类型检查。
- 构建或局部测试。
- 浏览器打开目标页面。
- Console 检查。
- 关键交互检查。
- 截图或 snapshot。

只跑命令不看浏览器，不算完整前端验收。

## 版本治理参考

如果项目有前后端联动，建议在发布时记录：

- Web 版本。
- Server 版本。
- Git SHA。
- 构建时间。
- API 契约版本。
- 本次发布的功能范围。

这类规则可以参考 `skills/skills/version-standard` 后再本地化。
