#!/bin/bash
# CI 测试脚本 - 任何修改都强制跑
# 用途: 在 pre-commit 钩子和 CI 环境中执行
# 设计: 防错式 - 任何一步失败都中断执行

set -e

echo "🧪 自动化测试开始..."
echo ""

# 1. 类型检查
echo "1/5 TypeScript 类型检查"
npx tsc --noEmit

# 2. 构建测试（仅在 web 目录）
if [ -d "web" ]; then
  echo "2/5 构建测试"
  (cd web && npm run build)
else
  echo "2/5 跳过构建（无 web 目录）"
fi

# 3. 单元测试
echo "3/5 单元测试"
if [ -d "web" ]; then
  (cd web && npm test -- --run)
else
  npm test -- --run
fi

# 4. E2E 测试（仅在 web 目录，且 web/e2e 存在）
echo "4/5 E2E 测试"
if [ -d "web/e2e" ]; then
  (cd web && npm run test:e2e)
else
  echo "  跳过（无 web/e2e 目录）"
fi

# 5. SPEC 覆盖检查
echo "5/5 SPEC 覆盖检查"
node scripts/check-spec-coverage.js

echo ""
echo "✅ 所有测试通过"
