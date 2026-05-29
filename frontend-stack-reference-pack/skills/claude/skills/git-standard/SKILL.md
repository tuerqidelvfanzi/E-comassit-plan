---
name: git-standard
description: "通用 Git 协作规范模板。目标项目使用前必须本地化分支策略、权限边界、提交语言和验收命令。"
---

# Git 协作规范模板

> 这是通用模板，不绑定任何具体项目。复制到目标项目后，先按团队真实流程本地化。

## 1. 推荐分支模型

| 分支 | 用途 | 合并方式 |
|------|------|----------|
| `main` | 生产发布 | 受保护，禁止直接推送 |
| `develop` | 集成验证 | 允许 feature 合入 |
| `feature/<desc>` | 功能开发 | 合入 develop |
| `hotfix/<desc>` | 紧急修复 | 合入 main 后同步 develop |

如果目标团队已有 Git Flow、Trunk Based Development 或 GitHub Flow，以目标团队流程为准。

## 2. 提交信息

推荐 Conventional Commits：

```text
<type>(<scope>): <description>
```

常用 type：

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`
- `ci`
- `perf`

## 3. 开始任务前

Agent 应先执行：

```bash
git status --short --branch
git fetch origin
```

然后确认：

- 当前分支。
- 工作树是否干净。
- 远端是否有新提交。
- 是否需要独立 feature 分支或 worktree。

## 4. 提交前

必须检查：

- `git status` 中没有误加入敏感文件。
- `.env`、密钥、token、构建产物没有进入提交。
- 远端状态没有明显落后或分叉。
- 已运行与变更风险匹配的检查。

## 5. 合并前

必须提供验收证据：

- 代码审查或白盒说明。
- 类型检查、测试或构建结果。
- 前端任务需要浏览器验收证据。
- 前后端联动任务需要说明双方版本或提交。

## 6. 安全边界

- 不主动 force push 受保护分支。
- 不直接提交密钥。
- 不随意修改 `.gitignore` 来隐藏问题。
- 不在未确认基线的脏工作树上宣称验收结论。
