#!/bin/bash
# 第三方审查脚本 - 生成独立 Agent 审查任务
# 用途: 在独立 Claude Code 会话中执行客观审查
# 设计: 防错式 - 必须由独立 Agent 执行，而非开发者本人

set -e

echo "🔍 启动第三方审查流程..."
echo ""

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REVIEW_DIR="$REPO_ROOT/docs/reviews"
REVIEW_FILE="$REVIEW_DIR/review-$(date +%Y%m%d-%H%M%S).md"
TASK_FILE="/tmp/review-task-$$.md"

mkdir -p "$REVIEW_DIR"

# 1. 收集变更信息
echo "📋 收集变更信息..."
CHANGED_FILES=$(git diff --name-only HEAD~1 2>/dev/null || git diff --name-only --cached)
COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null || echo "未提交变更")
SPEC_PATHS="docs/SPEC.md docs/theme-system/SPEC.md"

CHANGED_COUNT=$(echo "$CHANGED_FILES" | grep -c . 2>/dev/null || echo 0)
echo "  变更文件数: $CHANGED_COUNT"
echo "  最新提交: $COMMIT_MSG"

# 2. 生成审查任务（单 heredoc，避免多标记冲突）
cat > "$TASK_FILE" <<HEREDOC_END
# 第三方审查任务

## 角色
你是一名独立审查 Agent，与本次代码变更的开发者完全分离。
请以客观、严格的立场审查以下代码变更。

## 变更范围

\`\`\`
$CHANGED_FILES
\`\`\`

## 提交信息

\`\`\`
$COMMIT_MSG
\`\`\`

## 审查清单

请逐项对照 SPEC 文档 (\`$SPEC_PATHS\`) 检查：

### 1. 功能完整性
- [ ] SPEC 中定义的所有功能是否都已实现？
- [ ] 是否有功能被悄悄删减或"精简"？
- [ ] 边界情况是否处理？

### 2. 设计保留
- [ ] 36 个原始主题是否被删减？(应该保留)
- [ ] 设计规格中的功能是否完整保留？
- [ ] 是否有"为了简化而删除功能"的情况？

### 3. 代码质量
- [ ] 是否有硬编码颜色（应使用 CSS 变量）？
- [ ] 是否有未处理的 console.log / debugger？
- [ ] 是否有明显的性能问题？

### 4. 测试覆盖
- [ ] 单元测试是否覆盖关键路径？
- [ ] E2E 测试是否覆盖用户场景？
- [ ] 是否有未测试的边界条件？

### 5. 安全隐患
- [ ] 是否有 XSS / CSRF 风险？
- [ ] 是否有敏感信息泄露？
- [ ] 权限控制是否到位？

## 输出

请将审查报告写入: \`$REVIEW_FILE\`

报告格式：
\`\`\`markdown
# 审查报告

## 总结
- 通过 / 部分通过 / 不通过

## 问题清单
| 严重程度 | 问题 | 位置 | 建议 |
|---------|------|------|------|

## 亮点
- ...

## 必须修复
- ...

## 建议改进
- ...
\`\`\`

## 重要原则

1. **不要假设** - 不确定就标记为问题
2. **不要放过** - 即使是"小问题"也记录
3. **客观独立** - 不要考虑"开发者意图"，只看代码事实
4. **对照 SPEC** - 没有 SPEC 定义的功能是"额外"，有 SPEC 但未实现是"缺失"
HEREDOC_END

echo ""
echo "✅ 审查任务已生成: $TASK_FILE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📌 下一步操作："
echo ""
echo "1. 在另一个 Claude Code 窗口中执行："
echo "   /read $TASK_FILE"
echo ""
echo "2. 让独立 Agent 完成审查并写入报告："
echo "   $REVIEW_FILE"
echo ""
echo "3. 回到当前窗口，确认审查通过后再推送："
echo "   git push"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
