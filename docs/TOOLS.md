# 开发管道工具规范

## 概述

本文档定义 V3.0 开发管道中每个步骤使用的工具/技能。

---

## 工具映射表

| 管道步骤 | 主要工具 | 辅助工具 | 产出物 |
|----------|----------|----------|--------|
| **需求** | Claude Code + 文档模板 | 用户访谈 | 需求文档 |
| **调研** | Claude Code + GitHub API | 竞品分析 | 调研报告 |
| **SPEC** | Claude Code | 接口文档工具 | SPEC.md |
| **实现** | Claude Code | Cursor规则 | 源代码 |
| **自测** | tsc + vitest + playwright | ESLint | 测试报告 |
| **验收** | Claude Code (独立会话) | 第三方审查 | 验收报告 |

---

## 1. 需求阶段

### 主要工具

| 工具 | 用途 | 使用方式 |
|------|------|----------|
| **Claude Code** | 需求分析、文档生成 | 对话式 |
| **文档模板** | 标准化需求格式 | 模板填充 |

### 工具配置

```markdown
工具: Claude Code (MiniMax 大模型)
输入: 用户需求描述
输出: 需求文档 (.md)
```

### 产出物

```
docs/requirements/
├── REQ-001-采集箱.md
├── REQ-002-标题优化.md
└── REQ-003-发布管理.md
```

---

## 2. 调研阶段

### 主要工具

| 工具 | 用途 | 使用方式 |
|------|------|----------|
| **Claude Code** | 竞品分析、技术对比 | 对话式 |
| **GitHub API** | 库 stars/功能对比 | 脚本查询 |
| **npm registry** | 包版本对比 | npm view |

### 工具配置

```bash
# GitHub 库对比脚本
gh api graphql -f query='
{
  repository(owner:"facebook", name:"react") {
    stargazerCount
    description
  }
}'
```

### 调研清单

- [ ] 竞品功能对比
- [ ] 开源库 stars 对比
- [ ] 第三方 API 定价
- [ ] 性能基准测试

### 产出物

```
docs/research/
├── RES-001-看板组件对比.md
├── RES-002-表格组件对比.md
└── RES-003-第三方服务对比.md
```

---

## 3. SPEC 阶段

### 主要工具

| 工具 | 用途 | 使用方式 |
|------|------|----------|
| **Claude Code** | 接口定义、数据模型 | 对话式 |
| **TypeScript** | 类型生成 | 自动推导 |

### 工具配置

```typescript
// 使用 Claude Code 生成接口定义
interface KanbanColumn {
  id: string;
  title: string;
  tasks: Task[];
}
```

### 产出物

```
docs/
├── SPEC.md                    # 主规格文档
├── theme-system/
│   └── SPEC.md               # 主题系统规格
├── API.md                    # API 接口定义
└── DATA_MODELS.md           # 数据模型
```

---

## 4. 实现阶段

### 主要工具

| 工具 | 用途 | 使用方式 |
|------|------|----------|
| **Claude Code** | 代码生成、重构 | 对话式 |
| **Cursor 规则** | 代码规范 | 自动应用 |
| **@hello-pangea/dnd** | 看板拖拽 | 库使用 |

### 工具配置

```bash
# 开发服务器
npm run dev

# 代码格式化
npx prettier --write src/

# Cursor 规则位置
.claude/rules/
├── design-preservation.md    # 设计保留原则
└── code-style.md            # 代码风格
```

### 实现清单

- [ ] 遵循 design-preservation.md 规则
- [ ] 不删减设计规格中的任何功能
- [ ] 使用 CSS 变量而非硬编码颜色
- [ ] 组件使用语义化 className

---

## 5. 自测阶段

### 主要工具

| 工具 | 用途 | 命令 |
|------|------|------|
| **TypeScript** | 类型检查 | `npx tsc --noEmit` |
| **ESLint** | 代码规范 | `npm run lint` |
| **Prettier** | 代码格式化 | `npx prettier --check .` |
| **Vitest** | 单元测试 | `npm test` |
| **Playwright** | E2E测试 | `npm run test:e2e` |

### 工具配置

```json
// package.json
{
  "scripts": {
    "dev": "vite --port=3004 --host 0.0.0.0",
    "build": "vite build",
    "lint": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

### 自测清单

```bash
# 完整自测流程
1. npx tsc --noEmit           # 类型检查
2. npm run build              # 构建测试
3. npm test                   # 单元测试
4. npm run test:e2e           # E2E测试
5. git add -A && git commit  # 提交代码
6. git push                   # 推送到远程
```

### 产出物

```
test-results/
├── unit-test-report.html
└── e2e-test-report.html
```

### Git 推送规则

| 条件 | 操作 |
|------|------|
| 测试全部通过 | 自动推送 |
| 测试部分通过 | 修复后推送 |
| 测试失败 | 禁止推送 |

---

## 6. 验收阶段

### 主要工具

| 工具 | 用途 | 使用方式 |
|------|------|----------|
| **Claude Code (独立会话)** | 第三方审查 | 独立Agent |
| **浏览器** | 手动测试 | 手动操作 |
| **SPEC 对照表** | 逐项检查 | 清单 |

### 验收清单

```markdown
## 功能验收对照表

| SPEC 定义 | 实现状态 | 验收结果 |
|-----------|----------|----------|
| 4个预设主题包 | ✅ 已实现 | ✅ 通过 |
| 配色微调器 | ✅ 已实现 | ✅ 通过 |
| 看板拖拽 | ✅ 已实现 | ✅ 通过 |
| ... | ... | ... |
```

---

## 工具调用规则

### 何时调用 Superpower

| 场景 | Superpower 任务 |
|------|-----------------|
| 需求不明确 | 需求分析 + 文档生成 |
| 技术选型困难 | 竞品分析 + 技术对比 |
| 代码质量差 | 代码审查 + 重构建议 |
| 遇到 bug | 根因分析 + 修复方案 |
| 测试覆盖率低 | 测试用例生成 |
| 需要第三方审查 | 独立 Agent 审查 |

### 调用格式

```
@superpower <任务类型>
<具体描述>

示例：
@superpower research
需要对比看板组件库：
- @hello-pangea/dnd
- dnd-kit
- react-beautiful-dnd
请从 stars、功能、维护状态等维度分析
```

---

## 配置文件

### Claude Code 配置

```json
// .claude/settings.json
{
  "tools": {
    "bash": true,
    "read": true,
    "edit": true,
    "write": true,
    "glob": true
  }
}
```

### Cursor 规则

```
.claude/rules/design-preservation.md  # 设计保留原则
.claude/rules/code-style.md           # 代码风格
.claude/skills/SKILL.md              # 图片理解工具
```

---

## 快速参考

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建

# 测试
npx tsc --noEmit        # 类型检查
npm test                 # 单元测试
npm run test:e2e         # E2E测试

# 代码质量
npx prettier --write .   # 格式化
npm run lint             # 检查

# Git（自测通过后执行）
git add -A              # 暂存所有更改
git commit -m "描述"     # 提交
git push                 # 推送到远程
```
