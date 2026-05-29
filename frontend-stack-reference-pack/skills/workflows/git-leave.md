---
name: git-leave
description: "仅在 feature 等派生分支上可用，用于将当前进度临时存档提交加推送，然后切回 develop 分支但不作合并。"
---

# `/git-leave` — 临时存档与回城

## 0. 前置约束
> **⚠️ 必须执行**：在开始本工作流的任何操作前，AI 必须首先确认已查阅并加载了 **`git-standard`** 技能，并在后续操作中遵守其规定的所有限制条件。

## 1. 分支校验
- 通过 `git branch --show-current` 获取当前分支名。
- **若当前位于 `develop`、`main` 或 `master`，立即阻断**：「`/git-leave` 仅允许在 `feature/`、`bugfix/` 等派生分支上使用，当前处于受保护的主干分支，操作已拒绝。」

## 2. 存档提交
确认处于安全的派生分支后：
- 执行 `git status`，向用户展示当前未提交的变更。
- 生成存档提交信息，例如：`chore: 临时存档 <功能描述> 未完进度`。
- **请求授权**：「请确认以上变更的存档提交，回复"确认"后将提交并推送至远端。」
- 获得授权后执行：
```bash
git add .
git commit -m "<已授权的存档提交信息>"
git push origin <当前分支名>
```

## 3. 切回主干
存档推送完成后，切换至 `develop` 并同步最新状态：
```bash
git checkout develop
git pull origin develop
```
向用户确认：「当前分支的进度已安全存档并推送至远端。已切回 `develop` 并同步至最新状态，可随时开始新的工作。」
