---
name: git-finish
description: "用于将当前功能分支闭环（Squash Merge 到 develop）、推送远端，并顺利拉出一个新的开发分支。"
---

# `/git-finish` — 功能闭环与新分支启动

## 0. 前置约束
> **⚠️ 必须执行**：在开始本工作流的任何操作前，AI 必须首先确认已查阅并加载了 **`git-standard`** 技能，并在后续操作中遵守其规定的所有限制条件。

## 1. 完整性检查
- 执行 `git status`，确认当前分支所有变更均已提交。
- 若存在未提交的改动，提示用户先执行 `/git-commit` 完成存档。
- 确认当前功能已完成验收门禁：白盒证据、自动化测试/构建证据、必要的浏览器或接口验收证据均已记录。
- 若本分支涉及前后端联动，必须同步检查 `version-standard`：记录对端仓库分支、Git SHA、版本号和兼容性结论。

## 2. 同步远端主干
切换至 `develop` 并拉取最新状态，确保合并基线为最新版本：
```bash
git checkout develop
git pull origin develop
```
若此过程出现冲突或未跟踪文件阻碍，须停下来提示用户解决。

## 3. Squash 合并与清理
获取人类明确授权后，将功能分支以 Squash 方式合并至 `develop`，推送后清理本地和远端旧分支：

```bash
git merge --squash <功能分支名>
# 生成中文汇总提交信息，需遵循 git-standard
git commit -m "<已授权的合并提交信息>"
git push origin develop
```

合并后清理分支，默认使用安全删除：
```bash
git branch -d <功能分支名>
git push origin --delete <功能分支名>
```

如果 `git branch -d` 因 squash merge 拒绝删除，不允许直接使用 `-D`。
必须先审计分支是否已无独立价值（`merge-base --is-ancestor` + `diff --stat`），
向人类报告并等待明确授权后，才允许使用 `git branch -D`。

## 4. 开启新周期
- 询问用户：「上一个任务已合入 develop 并推送完毕。下一个需求或修复是什么？」
- 根据用户回复，从最新 `develop` 切出符合规范的新分支：
```bash
git checkout develop
git checkout -b feature/<规范命名>
```
通知用户新分支已就绪，可以开始新一轮开发。
