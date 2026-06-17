# 独立审查报告 - B 轨道 (V3.1 主题系统增强)

**审查人**: 独立审查 Agent（前台 Track-2）
**审查日期**: 2026-06-02
**审查对象**: V3.1 主题市场实现
**对照文档**: [SPEC-B-V31-主题系统增强.md](../../SPEC-B-V31-主题系统增强.md) + [REQ-B-V31-主题系统增强.md](../../requirements/REQ-B-V31-主题系统增强.md)
**结论**: ⚠️ **部分通过**（7 项缺失 / 5 项不一致 / 4 个 Bug / 8 项建议）

---

## 1. 文件清单对照

| SPEC 定义 | 实际产出 | 状态 |
|-----------|---------|------|
| `types/theme-package.ts` | `web/src/types/theme-package.ts` (43 行) | ✅ |
| `lib/theme-storage.ts` | `web/src/lib/theme-storage.ts` (54 行) | ✅ |
| `components/theme/ThemePreview.tsx` | 存在 (60 行) | ✅ |
| `components/theme/ThemeMarketplace.tsx` | 存在 (104 行) | ✅ |
| `components/theme/ThemeImportExport.tsx` | **❌ 缺失**（合并到 Marketplace） | ❌ |
| `components/theme/ThemeTransition.tsx` | **❌ 缺失**（仅 CSS） | ❌ |
| `hooks/useThemeMarket.ts` | 存在 (87 行) | ✅ |
| `hooks/useThemeAnimation.ts` | **❌ 缺失** | ❌ |
| `styles/theme-transition.css` | 存在 (30 行) | ✅ |

**文件覆盖率**: 5/8 (62.5%)

---

## 2. 验收对照（26 项）

### 2.1 数据层（REQ-B F-B5）
| 编号 | 验收点 | 实现 | 状态 |
|------|--------|------|------|
| F-B1 | 4 主题预览图 | ✅ ThemePreview 组件 | ✅ |
| F-B1.2 | 卡片 >200px | ⚠️ 默认 200×130，刚好达线 | ⚠️ |
| F-B1.3 | 悬停 demo 视频 | ❌ 仅静态预览 | ❌ |
| F-B2.1 | 300ms fade | ✅ CSS transition | ✅ |
| F-B2.2 | 微调器颜色过渡 | ✅ CSS 应用到 .input | ✅ |
| F-B2.3 | 用户关闭动画 | ❌ 无 UI 开关 | ❌ |
| F-B3.1 | 导出 JSON | ✅ handleExport | ✅ |
| F-B3.2 | 导入 JSON | ✅ handleImport | ✅ |
| F-B3.3 | 元数据（作者/版本） | ✅ ThemePackage 字段 | ✅ |
| F-B3.4 | 导入校验 | ✅ validateThemePackage | ✅ |
| F-B4.1 | 派生自定义 | ⚠️ cloneFromPreset **未挂载** | ❌ |
| F-B4.2 | localStorage 持久化 | ✅ saveUserThemes | ✅ |
| F-B4.3 | 删除带二次确认 | ❌ 删除无 confirm | ❌ |
| F-B5.1 | useTheme 暴露切换 | ⚠️ 命名不一致（setActive vs setActiveTheme） | ⚠️ |
| F-B5.2 | 事件订阅 | ❌ **缺失**（无 on('change',...)） | ❌ |
| F-B5.3 | 编程式切换 | ⚠️ 1 行可行但无独立 API 文档 | ⚠️ |

**功能覆盖率**: 9/16 完全通过，3/16 部分通过，4/16 缺失

### 2.2 数据结构
| SPEC | 实际 | 差异 |
|------|------|------|
| `id: UUID v4` | `'user-' + Date.now().toString(36)` | ❌ **不是 UUID** |
| `name: 1-50 字符` | 无长度校验 | ❌ |
| `version: semver` | 仅字符串，无格式校验 | ❌ |
| `author: 邮箱或昵称` | 任意字符串 | ⚠️ |

### 2.3 API 不一致
| SPEC 签名 | 实际签名 | 状态 |
|-----------|---------|------|
| `exportTheme(theme): Blob` | `exportTheme(theme): string` | ❌ 返回类型不符 |
| `saveUserTheme(theme)` | `saveUserThemes(themes[])` | ❌ 名字+签名不符 |
| `deleteUserTheme(id)` | 仅 `removeUserTheme` 在 hook 中 | ❌ 无独立函数 |
| `useThemeMarket().setActiveTheme` | `useThemeMarket().setActive` | ⚠️ 命名不符 |
| `useThemeMarket().exportCurrent` | 无 | ❌ 缺失 |
| `useThemeMarket().import(file)` | 无（仅组件内 onChange） | ❌ 缺失 |

---

## 3. 发现的 Bug

### 🔴 Bug-1: 克隆函数死代码
**位置**: [useThemeMarket.ts:62-74](../../web/src/hooks/useThemeMarket.ts)
**问题**: `cloneFromPreset` 函数定义但**无人调用**
**影响**: F-B4.1 功能不可用
**修复**: 挂载到 UI 按钮

### 🔴 Bug-2: 重复 ID 风险
**位置**: [useThemeMarket.ts:37-38](../../web/src/hooks/useThemeMarket.ts)
```typescript
const allPresets = [...builtInPresets, ...userPresets];
const activeTheme = allPresets.find(t => t.id === activeId) || builtInPresets[0];
```
**问题**: 如果导入的 JSON 包含与内置主题相同的 ID，会同时出现两份。`activeTheme.find` 只返回第一个
**影响**: 状态错乱
**修复**: 导入时加 `user-` 前缀，或检测冲突

### 🔴 Bug-3: 删除无确认
**位置**: [ThemeMarketplace.tsx:91-94](../../web/src/components/theme/ThemeMarketplace.tsx)
**问题**: 点击"删除"立即生效，无 `confirm()` 二次确认
**影响**: REQ-B F-B4.3 不达标
**修复**: 添加 `window.confirm()` 或自定义 Modal

### 🔴 Bug-4: 无文件大小限制
**位置**: [ThemeMarketplace.tsx:34-48](../../web/src/components/theme/ThemeMarketplace.tsx)
**问题**: `FileReader.readAsText` 无大小限制
**影响**: 100MB JSON 会冻结浏览器
**修复**: 限制 1MB + 错误提示

### 🟡 Bug-5: export 文件名不安全
**位置**: [ThemeMarketplace.tsx:28](../../web/src/components/theme/ThemeMarketplace.tsx)
```typescript
a.download = theme.name + '.theme.json';
```
**问题**: 若 theme.name 含 `/` `\` `:` 等字符，部分浏览器会失败
**影响**: 导出失败无提示
**修复**: sanitize 文件名

### 🟡 Bug-6: 数据迁移缺失
**位置**: [theme-storage.ts:loadUserThemes](../../web/src/lib/theme-storage.ts)
**问题**: 仅校验 JSON 合法性，**不校验每条记录结构**
**影响**: V3.2 字段新增时旧数据可能崩溃
**修复**: 在 loadUserThemes 中调用 `validateThemePackage` 过滤

### 🟡 Bug-7: 性能 - 缺 useMemo
**位置**: [ThemeMarketplace.tsx:17-18](../../web/src/components/theme/ThemeMarketplace.tsx)
```typescript
const list = (tab === 'builtIn' ? allPresets : userPresets)
  .filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
```
**问题**: 每次 render 都重算过滤
**影响**: 100+ 主题时卡顿
**修复**: `useMemo(() => ..., [allPresets, userPresets, tab, search])`

### 🟡 Bug-8: 无障碍缺失
**位置**: [ThemePreview.tsx](../../web/src/components/theme/ThemePreview.tsx)
**问题**: 缺 `aria-label`、`role="button"`、键盘事件
**影响**: 屏幕阅读器和键盘用户无法使用
**修复**: 加 a11y 属性

---

## 4. 设计退化检查（防 36 主题重演）

| 检查项 | 状态 |
|--------|------|
| 4 内置主题是否完整 | ✅（THEME_PRESETS 4 个） |
| 是否删减了 V3.0 主题 | ✅ 无删减 |
| 是否引入了重复主题 | ✅ 无 |
| 数据模型字段是否减少 | ⚠️ thumbnail 字段定义但未使用 |
| SPEC 接口签名是否偏离 | ❌ 3 处签名不符 |

**结论**: 无大规模删减，但有 3 处 API 命名偏离 SPEC

---

## 5. 缺失的 SPEC 组件

| 缺失项 | 严重程度 | 影响 |
|--------|---------|------|
| `ThemeImportExport.tsx` | 🟡 中 | 合并到 Marketplace 内部，违反单一职责 |
| `ThemeTransition.tsx` | 🟡 中 | View Transitions API 标注为"渐进增强"但**未实现** |
| `useThemeAnimation.ts` | 🟢 低 | 仅 CSS 方案可接受 |
| `on('change', ...)` 事件 | 🟡 中 | F-B5.2 不达标 |
| 用户关闭动画的 UI | 🟡 中 | F-B2.3 不达标 |
| 筛选下拉（年龄/视觉风格） | 🟢 低 | "筛选 ▾" 在 SPEC 4.1 中有 |

---

## 6. 安全性审查

| 项目 | 评级 | 说明 |
|------|------|------|
| XSS via theme.name | ✅ | React 自动转义 |
| XSS via data-theme attr | ✅ | setAttribute 不会执行 JS |
| localStorage 容量 | ⚠️ | 无限制（~5MB 通常够用） |
| JSON 注入 | ⚠️ | 校验仅看 required 字段，未深校验 colors 字段 |
| DoS via 大文件 | ❌ | 见 Bug-4 |

---

## 7. 测试覆盖

| 文件 | 覆盖率 | 状态 |
|------|--------|------|
| `types/theme-package.test.ts` | 4/4 (100%) | ✅ |
| `lib/theme-storage.test.ts` | 6/6 (100%) | ✅ |
| `useThemeMarket.ts` | **0 测试** | ❌ |
| `ThemeMarketplace.tsx` | **0 测试** | ❌ |
| `ThemePreview.tsx` | **0 测试** | ❌ |
| 导入/导出 E2E | **0 测试** | ❌ |

**测试覆盖率**: 10/10 单元测试通过，但**仅覆盖数据层**，UI 0 覆盖

---

## 8. 总结

### 通过 ✅
- 核心数据模型正确
- 4 内置主题保留完整
- import/export 流程闭环
- 持久化机制正常
- TypeScript 类型严格
- 26 项中 9 项完全通过

### 警告 ⚠️
- 3 处 API 命名偏离 SPEC
- 1 处返回类型不符
- 8 项建议改进（性能/a11y）

### 不通过 ❌
- 3 个 SPEC 组件未实现（ThemeImportExport / ThemeTransition / useThemeAnimation）
- 4 个 Bug 需修复
- 5 个 SPEC 验收点不达标
- 0 个组件/E2E 测试

### 评分
| 维度 | 得分 |
|------|------|
| 功能完整性 | 65% |
| SPEC 一致性 | 70% |
| 代码质量 | 75% |
| 测试覆盖 | 30% |
| 安全性 | 80% |
| **综合** | **64%** |

### 建议
1. **必须修复** 4 个 Bug（删除确认、文件大小、ID 冲突、克隆死代码）
2. **必须补齐** ThemeImportExport 独立组件
3. **必须添加** useThemeMarket 单元测试
4. **建议实现** View Transitions API（即使渐进增强也至少 fallback）
5. **建议添加** 组件级 + E2E 测试

### 是否可合并？
**❌ 不可合并**（main 分支）。需要：
1. 修复 4 个 Bug
2. 实现 3 个缺失组件
3. 添加至少 5 个组件/E2E 测试
4. 重新跑全套 pre-commit 检查

### 改进后预计
- 当前：64%
- 修复后预期：85-90%
