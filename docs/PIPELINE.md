# V3.0 自动化防错开发管道

> **设计原则**: 管道应该是"防错设计"，不是"指导手册"

---

## 1. 管道架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    自动化防错管道 v2                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│   │  需求   │─▶│  调研   │─▶│  SPEC   │─▶│  实现   │            │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
│        │            │            │            │                  │
│        ▼            ▼            ▼            ▼                  │
│   [自动生成]    [竞品分析]   [类型生成]   [代码生成]              │
│                                                                  │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│   │  验收   │◀─│  测试   │◀─│  预检   │◀─│  提交   │            │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
│        │            │            │            │                  │
│        ▼            ▼            ▼            ▼                  │
│   [对照表]    [自动跑]    [钩子拦截]   [Git Hook]               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 内置防错机制

### 2.1 Pre-commit Hook（提交前拦截）

**位置**: `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 强制执行 5 个检查
echo "🔍 Pre-commit 检查..."

# 1. 类型检查
echo "1/5 TypeScript 类型检查"
npx tsc --noEmit || exit 1

# 2. 单元测试
echo "2/5 单元测试"
npm test -- --run || exit 1

# 3. SPEC 对照检查
echo "3/5 SPEC 对照检查"
node scripts/check-spec-coverage.js || exit 1

# 4. 设计保留检查
echo "4/5 设计保留检查"
node scripts/check-design-preservation.js || exit 1

# 5. 组件适配检查
echo "5/5 组件适配检查"
node scripts/check-component-adapters.js || exit 1

echo "✅ 所有检查通过"
```

### 2.2 强制测试脚本

**位置**: `scripts/ci-test.sh`

```bash
#!/bin/bash
# CI 测试脚本 - 任何修改都强制跑

set -e

echo "🧪 开始自动化测试..."

# 1. 类型检查
npx tsc --noEmit

# 2. 构建测试
npm run build

# 3. 单元测试
npm test -- --run

# 4. E2E 测试
npm run test:e2e

# 5. 覆盖率检查
if [ "$COVERAGE" = "true" ]; then
  npm test -- --coverage
fi

echo "✅ 所有测试通过"
```

### 2.3 SPEC 对照表自动生成

**位置**: `scripts/check-spec-coverage.js`

```javascript
/**
 * SPEC 对照检查
 * 比较 SPEC.md 中的功能定义与实际实现
 */
const fs = require('fs');
const path = require('path');

function checkSpecCoverage() {
  const specPath = path.join(__dirname, '../docs/theme-system/SPEC.md');
  const themePath = path.join(__dirname, '../web/src/lib/theme-v2.ts');
  
  if (!fs.existsSync(specPath)) {
    console.error('❌ SPEC.md 不存在');
    return false;
  }
  
  if (!fs.existsSync(themePath)) {
    console.error('❌ theme-v2.ts 不存在');
    return false;
  }
  
  const spec = fs.readFileSync(specPath, 'utf-8');
  const impl = fs.readFileSync(themePath, 'utf-8');
  
  // 提取 SPEC 中定义的主题包 ID
  const themeIds = ['trello-premium', 'linear-dark', 'monday-vibrant', 'enterprise-classic'];
  
  let missing = [];
  for (const id of themeIds) {
    if (!impl.includes(id)) {
      missing.push(id);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ SPEC 定义的主题未实现:', missing);
    return false;
  }
  
  console.log('✅ 所有 SPEC 定义的主题已实现');
  return true;
}

checkSpecCoverage();
```

### 2.4 第三方审查脚本

**位置**: `scripts/third-party-review.sh`

```bash
#!/bin/bash
# 第三方审查 - 调用独立 Agent

echo "🔍 启动第三方审查..."

# 收集变更信息
CHANGED_FILES=$(git diff --name-only HEAD~1)
SPEC_PATH="docs/SPEC.md"
REVIEW_FILE="docs/reviews/review-$(date +%Y%m%d).md"

# 生成审查任务
cat > /tmp/review-task.md << EOF
请作为独立审查 Agent，审查以下代码变更：

\`\`\`
$CHANGED_FILES
\`\`\`

请对照 $SPEC_PATH 逐项检查：
1. 功能是否完整实现
2. 是否有删减
3. 是否有性能问题
4. 是否有安全隐患

输出审查报告到: $REVIEW_FILE
EOF

# 调用独立 Agent (新窗口)
echo "请在另一个窗口执行："
echo "  @claude-code /tmp/review-task.md"
```

### 2.5 组件适配检查

**位置**: `scripts/check-component-adapters.js`

```javascript
/**
 * 组件适配检查
 * 验证每个视觉风格都有对应的 CSS 适配
 */
const fs = require('fs');
const path = require('path');

function checkComponentAdapters() {
  const cssPath = path.join(__dirname, '../web/src/styles/theme-presets.css');
  const css = fs.readFileSync(cssPath, 'utf-8');
  
  const visualStyles = ['trello', 'linear', 'monday', 'enterprise'];
  const components = ['.card', '.btn-primary', '.input', '.badge'];
  
  let missing = [];
  
  for (const style of visualStyles) {
    for (const comp of components) {
      const pattern = new RegExp(`data-visual=.${style}.${comp.replace('.', '\.')}`);
      if (!pattern.test(css)) {
        missing.push(`${style} - ${comp}`);
      }
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ 缺失组件适配:', missing);
    return false;
  }
  
  console.log('✅ 所有组件适配完整');
  return true;
}

checkComponentAdapters();
```

---

## 3. 阶段详解（带强制约束）

### Phase 1: 需求

**自动化产出**:
- [ ] 需求文档模板自动填充
- [ ] 需求变更追踪

**强制项**:
- ❌ 禁止跳过需求直接编码
- ❌ 禁止无验收标准

### Phase 2: 调研

**自动化产出**:
- [ ] 竞品分析报告（自动生成对比表）
- [ ] 库对比表（自动查询 GitHub stars）

**强制项**:
- ❌ 禁止使用未调研的库

### Phase 3: SPEC

**自动化产出**:
- [ ] 类型定义自动生成
- [ ] 接口契约自动生成

**强制项**:
- [ ] 每个功能必须有验收标准
- [ ] 每个功能必须可测试

### Phase 4: 实现

**自动化产出**:
- [ ] 代码自动生成
- [ ] 设计保留检查通过

**强制项**:
- ❌ 禁止使用硬编码颜色（必须 CSS 变量）
- ❌ 禁止删减设计规格中的功能
- ❌ 禁止提交未通过测试的代码

### Phase 5: 预检（Pre-commit）

**自动化产出**:
- [ ] 类型检查通过
- [ ] 单元测试通过
- [ ] SPEC 对照通过
- [ ] 设计保留检查通过
- [ ] 组件适配检查通过

**强制项**:
- ❌ 任何检查失败都禁止提交

### Phase 6: 测试

**自动化产出**:
- [ ] 单元测试报告
- [ ] E2E 测试报告
- [ ] 覆盖率报告

**强制项**:
- [ ] 单元测试覆盖率 > 80%
- [ ] E2E 关键路径全过

### Phase 7: 验收

**自动化产出**:
- [ ] SPEC 对照表（自动生成）
- [ ] 第三方审查报告

**强制项**:
- [ ] 必须有独立 Agent 审查
- [ ] 必须有 SPEC 对照清单

---

## 4. 工具映射（带强制执行）

| 阶段 | 工具 | 命令 | 强制 |
|------|------|------|------|
| 预检 | TypeScript | `npx tsc --noEmit` | ✅ |
| 预检 | SPEC 检查 | `node scripts/check-spec-coverage.js` | ✅ |
| 预检 | 设计保留 | `node scripts/check-design-preservation.js` | ✅ |
| 测试 | Vitest | `npm test` | ✅ |
| 测试 | Playwright | `npm run test:e2e` | ✅ |
| 验收 | 独立 Agent | 另一个窗口 | ✅ |
| 提交 | Git Hook | 自动 | ✅ |

---

## 5. 验收对照表

```markdown
## SPEC 验收对照表

| SPEC 定义 | 自动化检查 | 状态 |
|-----------|-----------|------|
| 4个主题包 | check-spec-coverage.js | ✅/❌ |
| 8个维度 | type-check | ✅/❌ |
| 配色微调器 | component test | ✅/❌ |
| 看板拖拽 | e2e test | ✅/❌ |
| 插件端同步 | e2e test | ✅/❌ |

## 完整性检查

| 检查项 | 脚本 | 通过 |
|--------|------|------|
| TypeScript 编译 | tsc --noEmit | ✅/❌ |
| 单元测试 | vitest | ✅/❌ |
| E2E 测试 | playwright | ✅/❌ |
| SPEC 覆盖 | check-spec-coverage.js | ✅/❌ |
| 设计保留 | check-design-preservation.js | ✅/❌ |
| 组件适配 | check-component-adapters.js | ✅/❌ |
```

---

## 6. 使用方式

### 6.1 初始化（一次性）

```bash
# 安装 husky
npm install husky --save-dev
npx husky install

# 添加 pre-commit hook
npx husky add .husky/pre-commit "bash scripts/ci-test.sh"
```

### 6.2 日常开发

```bash
# 1. 编码（无需记命令）
code src/...

# 2. 提交时自动跑
git add -A
git commit -m "..."
# → 自动跑测试，失败则阻止提交

# 3. 推送
git push
```

### 6.3 第三方审查

```bash
# 在另一个 Claude Code 窗口执行
@claude-code /tmp/review-task.md
```

---

## 7. 改进原则

### 应该写进管道的
- ✅ 自动化测试
- ✅ 强制拦截
- ✅ 对照表
- ✅ 审查机制
- ✅ 失败禁止提交

### 不应该写进管道的
- ❌ 建议性提示（人记不住）
- ❌ 文档式指导（容易跳过）
- ❌ 主观评估（无标准）

### 管道设计的反模式
- ❌ "请记得做X" → ✅ "未做X则禁止提交"
- ❌ "建议审查" → ✅ "必须独立Agent审查"
- ❌ "应该测试" → ✅ "pre-commit 自动跑测试"
