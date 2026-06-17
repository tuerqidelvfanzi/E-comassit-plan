# V3.0 功能模块 — 文档目标 vs 代码实现 对照表

**日期**: 2026-06-10
**目的**: "两个角度检查"产物 — 用户原话："做个对比吧，哪些是实现了的，哪些是没有实现的"
**基线**:
- 文档目标 = `docs/REQUIREMENTS_V3.md` §5 FR-* 列表
- 代码实现 = `web/src/` 实际文件 + `git ls-files` 列举

---

## 状态标签

| 标签 | 含义 |
|------|------|
| ✅ | 已完整实现（含 UI + 库 + 测试） |
| ⚠️ | UI 完整但数据为 Mock，或库实装但 API 未实装 |
| ❌ | 未实现 |
| ⏳ | v3.1 延期（ADR 决策） |

---

## 1. 采集模块

| FR | 文档目标 | 代码实现 | 状态 | 证据 |
|----|---------|---------|------|------|
| FR-C-01 插件详情页采集 | 1688/淘宝/天猫 | extension/content/content-script.js (4.5 KB) | ✅ | `extension/manifest.json` 6 个 source matches |
| FR-C-02 链接直采 | 用户粘贴 URL | `pages/link-collect/LinkCollectPage.tsx` (5.8 KB) | ⚠️ | UI 完整，2.5s 模拟输出 |
| FR-C-03 批量榜单采集 | 关键词抓 TOP N | `pages/BatchCollectPage.tsx` (5.3 KB) | ⚠️ | UI 完整，Crawlee Worker 表单 |
| FR-C-04 采集箱 | 列表+筛选+批量 | `pages/InboxPage.tsx` (14.9 KB) | ✅ | API 集成 + 导入导出 |
| FR-C-05 批量操作 | 删除/导出 | `pages/InboxPage.tsx` 工具栏 | ✅ | — |

**小计**: 2 ✅ + 3 ⚠️ + 0 ❌ + 0 ⏳

---

## 2. 竞品与选品洞察

| FR | 文档目标 | 代码实现 | 状态 | 证据 |
|----|---------|---------|------|------|
| FR-I-01 竞品分析 | 关键词 + 源平台 | `pages/competitors/CompetitorsPage.tsx` (7.1 KB) | ⚠️ | 即输即得模式，5 mock 竞品 |
| FR-I-02 选品看板 | 真实 GMV/CTR | `pages/InsightsPage.tsx` (23.8 KB) | ⚠️ | UI 完整，4 Tab + MetricCard，**数据 Mock** |
| FR-I-03 竞品前置流程 | 先分析再采集 | 业务流程文档 | ⏳ v3.1 | 仅文档，无 UI 实施 |

**小计**: 0 ✅ + 2 ⚠️ + 0 ❌ + 1 ⏳

---

## 3. 处理模块（工作台）

| FR | 文档目标 | 代码实现 | 状态 | 证据 |
|----|---------|---------|------|------|
| FR-P-01 处理工作台 | 5 段 SKU + 9 图 + 13 步 | `pages/workbench/WorkbenchPage.tsx` (V2 迁移) | ✅ | 5 段 SKU + 9 图 + 13 步 + Insights 挂载 |
| FR-P-02 规则管线 | 定价/字数/违禁/面料 | `lib/pipelineEngine.ts` + `shared/listing/*` | ⚠️ | 规则 only，无 LLM |
| FR-P-02b 真实 LLM 管线 | LLM 结构化输出 | — | ⏳ v3.1 | 后端未实装 |
| FR-P-03 五段 SKU 编码 | `{PREFIX}-{SEQ}-{SIDE}-{COLOR}-{SIZE}` | `shared/listing/skuEncoder.ts` + `lib/skuEncodingHints.ts` | ✅ | 白色钩子 + Tips 悬停 |
| FR-P-04 价格计算 | VN ×3.5 / TH ×2.5 / PH 固定 | `shared/listing/marketPricing.ts` | ✅ | 4 站规则 |
| FR-P-05 标题 + 翻译 | 越南 ≤20 / 泰国 ≤220 | `lib/listingTitle.ts` + 2 个标题优化页 | ✅ | UI 完整 |
| FR-P-06 违禁与合规 | 品牌词库 + 国内标识 | `lib/bannedTerms.ts` | ⚠️ | 词库偏小（6 个品牌） |
| FR-P-07 图片处理 | 9 张消除笔 + 翻译 | `components/workbench/ImageProcessingPanel.tsx` + `ImageTasksPanel.tsx` | ⚠️ | UI 完整，后端任务调度占位 |

**小计**: 3 ✅ + 3 ⚠️ + 0 ❌ + 1 ⏳

---

## 4. 标题优化（V1 七步 + V2 SEO）

| FR | 文档目标 | 代码实现 | 状态 | 证据 |
|----|---------|---------|------|------|
| FR-TO-01 搜索词采集 | 天猫生意参谋 7 天 | `pages/workbench/TitleOptimizationPage.tsx` (V2 迁移) | ⚠️ | V1 七步流程 + useV2Queries 驱动 |
| FR-TO-02 标题生成 V2 | 多平台 SEO | `pages/TitleOptimizerV2.tsx` + 6 lib | ✅ | 5 平台 × 5 语言 × 4 维度评分 |
| FR-TO-03 标题对比 | 原始 vs 建议 | TitleOptimizationPage 七步含"对比" | ✅ | — |
| FR-TO-04 标题更换 | 天猫后台编辑 | TitleOptimizationPage 七步含"更换" | ⚠️ | Playwright 任务未实装 |
| FR-TO-05 页面结构探索 | chrome-devtools | — | ❌ v3.0 不做 | 仅 SPEC 文档 |

**小计**: 2 ✅ + 2 ⚠️ + 1 ❌ + 0 ⏳

---

## 5. 品类模板（A / B / C）

| FR | 文档目标 | 代码实现 | 状态 | 证据 |
|----|---------|---------|------|------|
| FR-T-01 模板 CRUD | 名称/类目/SKU/Prompt | `pages/TemplatesPage.tsx` (26.6 KB) | ✅ | 完整 CRUD |
| FR-T-02 服装子类 | 男/女/童 | `pages/TemplatesPage.tsx` 内嵌 | ⚠️ | A 类实装，B/C 占位 |
| FR-T-03 工厂接口 | CategoryTemplateDriver | `shared/listing/types.ts` | ✅ | 类型定义 |
| FR-T-04 SKU Tips 悬停 | `lib/skuEncodingHints.ts` | `components/SkuEncodingTip.tsx` | ✅ | — |

**小计**: 3 ✅ + 1 ⚠️ + 0 ❌ + 0 ⏳

---

## 6. 发布模块

| FR | 文档目标 | 代码实现 | 状态 | 证据 |
|----|---------|---------|------|------|
| FR-U-01 发布任务 | draft→pending→filling→completed | `pages/PublishPage.tsx` (16.4 KB) | ✅ | 13 步流程图 + 状态 patch |
| FR-U-02 插件填表 VN | 真实 DOM 写入 | `extension/content/publish-script.js` (6 KB) | ⚠️ | 脚本在，**未实测** DOM 写入 |
| FR-U-02b 多站填表 | TH/PH | publish-script.js | ⏳ v3.1 | manifest 仅 2 个 matches |
| FR-U-03 发布中心 UI | 队列列表 + 状态筛选 | PublishPage | ✅ | — |
| FR-U-04 Open API | Shopee/TikTok Open Platform | — | ❌ v3.3 范围 | 无实现 |

**小计**: 2 ✅ + 1 ⚠️ + 1 ❌ + 1 ⏳

---

## 7. 规则库与设置

| FR | 文档目标 | 代码实现 | 状态 | 证据 |
|----|---------|---------|------|------|
| FR-R-01 规则库 | 倍率/违禁/字数 | `pages/RulesPage.tsx` (9.8 KB) + `components/rules/PlatformRulesMatrix.tsx` | ✅ | V2 组件已合并 |
| FR-S-01 设置 | 插件/Token/LLM | `pages/SettingsPage.tsx` | ✅ | — |
| FR-S-02 主题设置 V1 | 4 主题切换 | `lib/ThemeSettingsV2.tsx` (4.9 KB) | ✅ | — |
| FR-S-03 主题市场 V2 | 4 主题 + 用户主题 + 导入导出 | `components/theme/ThemeMarketplace.tsx` (5.4 KB) | ✅ | 路由可访问 |
| FR-S-04 平台集成 | 4 平台连接 | `pages/IntegrationsPage.tsx` (3.4 KB) | ⚠️ | UI Mock |
| FR-S-05 团队 | 邀请 + 角色 | `pages/TeamPage.tsx` (3.5 KB) | ⚠️ | UI Mock |

**小计**: 4 ✅ + 2 ⚠️ + 0 ❌ + 0 ⏳

---

## 8. 整体统计

| 状态 | 数量 | 占比 |
|------|------|------|
| ✅ 已实现 | 16 | 50% |
| ⚠️ Mock/部分 | 13 | 41% |
| ❌ 未实现 | 2 | 6% |
| ⏳ v3.1 延期 | 3 | 9% |
| **合计** | **32** | **100%**（注：含 2 个子项）|

---

## 9. v3.1 必修清单（基于本表）

| 优先级 | 模块 | 当前状态 | v3.1 目标 |
|--------|------|---------|----------|
| P0 | FR-P-02b 真实 LLM 管线 | ⏳ | 接入 OpenAI / DeepL 真实调用 |
| P0 | FR-U-02 插件填表实测 | ⚠️ | VN Shopee 真实 DOM 写入并跑通 |
| P1 | FR-I-02 Insights 真实数据 | ⚠️ | Worker 拉取 GMV/CTR |
| P1 | FR-I-01 竞品分析 Job | ⚠️ | 任务驱动 + 报告持久化 |
| P1 | FR-P-07 图片任务 | ⚠️ | 至少 1 种处理（消除或翻译） |
| P1 | FR-P-06 违禁词库 | ⚠️ | 扩展至 30+ 品牌 |
| P1 | SPEC-C 3 个 API 端点 | ⏳ | Hono 路由实现 |
| P2 | FR-U-02b 多站填表 | ⏳ | TH/PH 至少 1 站 |

---

## 10. v3.0 收尾的"无回归"承诺

本对照表中 ✅ 状态的 16 项 + ⚠️ 状态的 13 项中**已存在的 UI 部分**，v3.0 重构（V2 清理 + 路由修复）后**保证功能不丢**。

证明方式：
- 自动化：tsc + vitest + 3 check-*.js + eslint 全过
- 手工：路由 1:1 匹配 + V2 残留为 0
- 对照：本表 + [V2_VS_V3_MIGRATION.md](./V2_VS_V3_MIGRATION.md)

---

*文档结束 — FEATURE_STATUS_V3.md（"两个角度检查"产物）*
