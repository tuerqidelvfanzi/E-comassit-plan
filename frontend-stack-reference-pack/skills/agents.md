# Agent 协作入口模板

这个文件是通用模板，不绑定任何具体业务项目。

## 使用方式

目标项目可以把本文件内容合并到自己的 `AGENTS.md` 中，再根据团队流程本地化。

## 建议规则

- Agent 开始非琐碎任务前，先读取项目根目录 `AGENTS.md`。
- 涉及前端代码前，先读取目标项目自己的 `docs/FRONTEND_PROTOCOL.md`。
- 涉及 Git 操作前，先读取 `.agents/skills/git-standard/SKILL.md`。
- 涉及发布、部署或前后端协同时，先读取 `.agents/skills/version-standard/SKILL.md`。
- 项目 Skills 只是执行约束，不是业务代码模板。

## 本地化项

目标项目必须替换：

- 分支策略。
- 提交规范。
- 发布流程。
- 环境入口。
- 验收命令。
- 前后端仓库名。
- 业务模块名称。
