# V3.0 自动化防错开发管道

> **设计原则**: 管道应该是"防错设计"，不是"指导手册"
> **基线日期**: 2026-06-10（与 [REQUIREMENTS_V3.md](./REQUIREMENTS_V3.md) 同步）

---

## ⚠️ 重要说明（v3.0 基线）

> **本节示例代码（§2.3 §2.5）为教学简化版，实际脚本以 `scripts/` 目录文件内容为准。**
>
> **示例代码与实际脚本差异点**：
> - `check-spec-coverage.js`：文档示例仅检查 4 个主题 ID；实际脚本检查 `docs/theme-system/SPEC.md`、8 维度类型导出、ColorScheme 字段等。
> - `check-component-adapters.js`：文档示例用 `data-visual=X.Y` 正则；实际脚本检查 4×3×4=48 适配点矩阵。

---

## 1. 管道架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    自动化防错管道 v3.0                            │
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

### 2.1 Pre-commit Hook（v3.0 实际 6 项检查）

**位置**: `.husky/pre-commit`

**v3.0 实际执行 6 项**（v3.0 基线已确认）：

| # | 命令 | 用途 | 强制 |
|---|------|------|------|
| 1 | `npm run lint` (= `cd web && npx tsc --noEmit`) | TypeScript 类型检查 | ✅ |
| 2 | `npm test` (= `cd web && npm test -- --run`) | 单元测试 | ✅ |
| 3 | `node scripts/check-spec-coverage.js` | SPEC 对照检查 | ✅ |
| 4 | `node scripts/check-design-preservation.js` | 设计保留检查 | ✅ |
| 5 | `node scripts/check-component-adapters.js` | 组件适配检查 | ✅ |
| 6 | `npm run lint:eslint` (= `cd web && npx eslint .`) | ESLint 规则（含 no-hex-color） | ✅ v3.0 新增 |

**v3.0 变更点**：
- v2 → v3.0 新增第 6 步 ESLint（SPEC-A §2.3 验收项曾标记为"未接入 pre-commit"）；
- 通过根 `package.json` wrapper 解决 `npm test` 在 root cwd 失败问题（v3.0 之前根目录无 `package.json`）。

### 2.2 CI 脚本（独立流水线）

**位置**: `scripts/ci-test.sh`

v3.0 CI 脚本与 pre-commit 是**两套独立流水线**：
- pre-commit 跑 6 项快速检查（< 30 秒）
- CI 跑完整流程（tsc + build + vitest + playwright + coverage）

**v3.0 决策**：pre-commit 与 CI 分离，不在 pre-commit 中调 `ci-test.sh`（避免 commit 卡顿）。

### 2.3 SPEC 对照检查

**位置**: `scripts/check-spec-coverage.js`

> ⚠️ **本节为教学简化版示例，实际脚本实现更复杂**（请以文件实际内容为准）。

```javascript
/**
 * SPEC 对照检查（教学示例）
 * 实际脚本检查 docs/theme-system/SPEC.md、8 维度类型导出、ColorScheme 字段等
 */
function checkSpecCoverage() {
  // 实际逻辑：遍历 SPEC.md 中的功能定义，验证代码侧是否实现
  return true;
}
```

### 2.4 第三方审查脚本

**位置**: `scripts/third-party-review.sh`

> ⚠️ **v3.0 环境受限豁免**（ADR-008）：
>
> 当前环境无法在独立窗口启动 Claude Code Agent 进程。
> **v3.0 状态**：脚本生成任务文件供人工执行；**不阻塞** pre-commit。
> **v3.1 计划**：若环境支持，启动自动化。

### 2.5 组件适配检查

**位置**: `scripts/check-component-adapters.js`

> ⚠️ **本节为教学简化版示例，实际脚本检查 4 视觉风格 × 3 组件类型 × 4 状态 = 48 适配点**。

---

## 3. 阶段详解（v3.0 强制约束）

### Phase 1: 需求

**自动化产出**:
- [ ] 需求文档模板自动填充
- [ ] 需求变更追踪

**强制项**:
- ❌ 禁止跳过需求直接编码
- ❌ 禁止无验收标准

**v3.0 落地**：需求 → `docs/REQUIREMENTS_V3.md` §5 FR-* 列表，每条带状态标签。

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

**v3.0 落地**：
- `docs/SPEC-A-V30-收尾优化.md`（V3.0 收尾）
- `docs/SPEC-B-V31-主题系统增强.md`（V3.1 主题市场）
- `docs/SPEC-C-V40-AI标题优化器V2.md`（V4.0 标题优化器）

### Phase 4: 实现

**自动化产出**:
- [ ] 代码自动生成
- [ ] 设计保留检查通过

**强制项**:
- ❌ 禁止使用硬编码颜色（必须 CSS 变量）— ESLint `no-restricted-syntax` 检查
- ❌ 禁止删减设计规格中的功能 — `check-design-preservation.js` 校验
- ❌ 禁止提交未通过测试的代码 — pre-commit 拦截

### Phase 5: 预检（Pre-commit）— v3.0 6 步

**自动化产出**:
- [ ] 类型检查通过
- [ ] 单元测试通过
- [ ] SPEC 对照通过
- [ ] 设计保留检查通过
- [ ] 组件适配检查通过
- [ ] ESLint 通过（v3.0 新增）

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
- [ ] SPEC 对照表（自动生成）— `FEATURE_STATUS_V3.md`
- [ ] 第三方审查报告（v3.0 豁免）

**强制项**:
- [ ] 必须有 SPEC 对照清单
- ⚠️ 独立 Agent 审查 — v3.0 豁免，v3.1 实施

---

## 4. 工具映射（v3.0 与实际脚本对齐）

| 阶段 | 工具 | 命令 | 强制 | v3.0 状态 |
|------|------|------|------|----------|
| 预检 | TypeScript | `npm run lint` (= `cd web && npx tsc --noEmit`) | ✅ | ✅ |
| 预检 | ESLint | `npm run lint:eslint` | ✅ | ✅ v3.0 新增 |
| 预检 | SPEC 检查 | `node scripts/check-spec-coverage.js` | ✅ | ✅ |
| 预检 | 设计保留 | `node scripts/check-design-preservation.js` | ✅ | ✅ |
| 预检 | 组件适配 | `node scripts/check-component-adapters.js` | ✅ | ✅ |
| 测试 | Vitest | `npm test` | ✅ | ✅ |
| 测试 | Playwright | `cd web && npm run test:e2e` | ❌（CI 阶段） | ✅ 脚本在 |
| 验收 | 独立 Agent | 另一个窗口 | ⚠️ v3.0 豁免 | ⚠️ |
| 提交 | Git Hook | 自动 | ✅ | ✅ 6 步 |
| 性能 | Lighthouse | `bash scripts/perf-lighthouse.sh` | ❌ | ✅ 脚本在，待 `docs/perf-baseline/` 产出 |

### 非管道工具（与代码构建无关）

| 工具 | 命令 | 角色 | 强制 |
|------|------|------|------|
| 架构图生成 | `python3 scripts/build_arch_v100.py` | 文档产物生成器 | ❌ |
| 深度研究图 | `python3 scripts/build_deep_v100.py` 等 4 个 | 文档产物生成器 | ❌ |
| 重建 | `python3 scripts/rebuild_p1.py` | 文档产物生成器 | ❌ |
| 扩展图标生成 | `python3 scripts/gen-extension-icons.py` | 资源生成 | ❌ |
| SPA fallback | `node scripts/copy-spa-fallback.mjs` | web build 附属 | ✅（被 `web/package.json` build 引用） |
| 扩展打包 | `node scripts/zip-extension.mjs` | web build 附属 | ✅（被 `web/package.json` prebuild 引用） |
| LazyGit | `python3 scripts/lazygit.py` | 本地辅助 | ❌ |

> **v3.0 决策**：将 `build_*.py` 6 个 Python 脚本归类为"文档产物生成器"，**非代码管道工具**，不纳入 pre-commit。

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
| TypeScript 编译 | npm run lint | ✅/❌ |
| 单元测试 | npm test | ✅/❌ |
| E2E 测试 | cd web && npm run test:e2e | ✅/❌ |
| SPEC 覆盖 | check-spec-coverage.js | ✅/❌ |
| 设计保留 | check-design-preservation.js | ✅/❌ |
| 组件适配 | check-component-adapters.js | ✅/❌ |
| ESLint 规则 | npm run lint:eslint | ✅/❌（v3.0 新增）|
```

---

## 6. 使用方式

### 6.1 初始化（一次性）

```bash
npm install husky --save-dev
npx husky install
# v3.0 根目录新增 package.json wrapper（pre-commit 转发用）
```

### 6.2 日常开发

```bash
# 1. 编码（无需记命令）
code src/...

# 2. 提交时自动跑 6 项检查
git add -A
git commit -m "..."
# → 自动跑 6 项检查，失败则阻止提交

# 3. 推送
git push
```

### 6.3 第三方审查（v3.0 豁免）

```bash
# v3.0 状态：环境受限，无法自动启动独立 Agent
# 替代方案：人工在另一个窗口执行
# @claude-code /tmp/review-task.md
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
- ❌ "建议审查" → ✅ "必须独立Agent审查"（v3.0 豁免）
- ❌ "应该测试" → ✅ "pre-commit 自动跑测试"

---

## 8. v3.0 与 v2 差异清单

| # | 差异 | v2 | v3.0 |
|---|------|-----|------|
| 1 | pre-commit 步骤数 | 5 | 6（新增 ESLint）|
| 2 | 根 `package.json` | 不存在 | wrapper 存在 |
| 3 | `web/package.json` lint | `tsc --noEmit` | 保留 + 新增 `lint:eslint` |
| 4 | PIPELINE.md §2.3 §2.5 示例 | 实际为准 | 加 ⚠️ 提示"教学简化" |
| 5 | 第三方独立 Agent | 必选 | 环境受限豁免（ADR-008） |
| 6 | 文档基线 | REQUIREMENTS_V2 | REQUIREMENTS_V3（代码反向）|
| 7 | FR 状态标注 | 无 | ✅/⚠️/❌/⏳ 四级 |
| 8 | 路由权威源 | 文档 | `web/src/App.tsx` |
