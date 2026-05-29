---
name: git-start
description: "仅在 develop 分支上可用，用于从最新的 develop 基线拉取远端并切出一个新的功能分支。"
---

# `/git-start` — 开启新分支

## 0. 前置约束
> **⚠️ 必须执行**：在开始本工作流的任何操作前，AI 必须首先确认已查阅并加载了 **`git-standard`** 技能，并在后续操作中遵守其规定的所有限制条件。

## 1. 分支校验
- 通过 `git branch --show-current` 获取当前分支名。
- **若当前不在 `develop` 分支上，立即阻断**：「`/git-start` 仅允许在 `develop` 分支上执行。若需保存当前分支进度，请先使用 `/git-leave` 或 `/git-commit`。」

## 2. 同步远端基线
确保本地 `develop` 与远端保持一致：
```bash
git pull origin develop
```
若出现冲突或异常，提示用户解决后再继续。

## 3. 确认新分支信息
- 询问用户本次开发的需求或任务描述。
- 根据用户回复，按照 `git-standard` 规范生成分支名（如 `feature/0416-xxx`、`bugfix/0416-xxx`）。
- 向用户展示拟定的分支名，等待确认。

## 4. 创建新分支
获得确认后，从最新 `develop` 切出新分支：
```bash
git checkout -b <已确认的分支名>
```
向用户确认：「新分支 `<分支名>` 已创建并切换完毕，可以开始开发。」
