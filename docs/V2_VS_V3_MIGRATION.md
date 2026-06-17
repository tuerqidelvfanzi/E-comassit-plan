# V2 → V3 页面迁移映射

**日期**: 2026-06-10
**基线**: V3 路由 + V3 文档
**原则**: CLAUDE.md 铁律 — 保留设计规格要求的功能；V2 独有功能先迁移到 `pages/` 再删除 V2

---

## 1. V2 目录现状（v3.0 清理前）

```
web/src/v2/
├── api.ts                        (4.3 KB) 保留（被 hooks 间接依赖）
├── api-local.ts                  (12.0 KB) 保留
├── components/
│   ├── V2Shell.tsx               (0.9 KB) 删除
│   ├── MockBadge.tsx             (0.3 KB) 删除
│   ├── StatusChip.tsx            (0.8 KB) 删除
│   ├── PlatformRulesMatrix.tsx   (1.7 KB) 迁移 → components/rules/
│   └── RequirementModuleGrid.tsx (1.3 KB) 删除
├── config/
│   └── requirementModules.ts     (3.1 KB) 删除
├── hooks/
│   └── useV2Queries.ts           (5.5 KB) 保留（InsightsAttachPanel 用 useV2Competitors）
├── nav.ts                        (1.7 KB) 保留（AppLayout 引用）
├── pages/                        (14 文件) 见 §2
└── types.ts                      (4.0 KB) 保留
```

---

## 2. V2 页面决策矩阵

| # | V2 文件 | 体积 | 处理 | 目标位置 | 理由 |
|---|---------|------|------|---------|------|
| 1 | `v2/pages/BatchCollectV2Page.tsx` | 423 B | **删除** | — | 纯包装器（MockBadge），无新功能 |
| 2 | `v2/pages/CompetitorsPage.tsx` | 7.7 KB | **删除** | — | 任务驱动模式已被 `pages/competitors/CompetitorsPage.tsx` 即输即得模式替代 |
| 3 | `v2/pages/DashboardV2Page.tsx` | 3.7 KB | **删除** | — | RequirementModuleGrid 演示已过时 |
| 4 | `v2/pages/InboxV2Page.tsx` | 463 B | **删除** | — | 纯包装壳 |
| 5 | `v2/pages/InsightsV2Page.tsx` | 4.5 KB | **删除** | — | `pages/InsightsPage.tsx`（23.8 KB）是大版本 |
| 6 | `v2/pages/IntegrationsPage.tsx` | 2.0 KB | **删除** | — | Open API 配额内容已被 `SettingsPage` 覆盖 |
| 7 | `v2/pages/LinkCollectPage.tsx` | 2.4 KB | **删除** | — | `pages/link-collect/LinkCollectPage.tsx`（5.8 KB）是大版本 |
| 8 | `v2/pages/TeamPage.tsx` | 1.5 KB | **删除** | — | `pages/TeamPage.tsx`（3.5 KB）是大版本 |
| 9 | `v2/pages/TemplatesManageV2Page.tsx` | 809 B | **删除** | — | 依赖未注册的 `/app/templates/manage` 路由 |
| 10 | `v2/pages/TemplatesV2Page.tsx` | 3.3 KB | **删除** | — | `pages/TemplatesPage.tsx`（26.6 KB）支持 `embedded` 模式 |
| 11 | `v2/pages/TitleOptimizationPage.tsx` | 13.8 KB | **迁移** | `pages/workbench/TitleOptimizationPage.tsx` | 7 步流程是大版本 |
| 12 | `v2/pages/WorkbenchV2Page.tsx` | 16.3 KB | **迁移** | `pages/workbench/WorkbenchPage.tsx` | 完整工作台（5 段 SKU + 9 图 + 13 步） |
| 13 | `v2/pages/PublishV2Page.tsx` | 10.3 KB | **抽取特性** | `pages/PublishPage.tsx` | 插件演示闭环 + useSimulatePublishFill 合并 |
| 14 | `v2/pages/RulesV2Page.tsx` | 3.5 KB | **抽取组件** | `pages/RulesPage.tsx` | `<PlatformRulesMatrix />` 合并 |
| 15 | `v2/pages/index.ts` | 0 | **删除** | — | 无外部引用 |

**统计**：
- 删除：10 个页面 + 1 个 barrel
- 迁移：2 个完整页面（TitleOptimization + Workbench）
- 抽取特性：2 个页面（Publish + Rules）

---

## 3. 路由修复

### 3.1 路由 1:1 映射

| 路由 | v2 指向 | v3 指向 | 修复原因 |
|------|---------|---------|---------|
| `/app/inbox` | `pages/inbox/InboxPage.tsx`（6.8 KB mock） | `pages/InboxPage.tsx`（14.9 KB 完整 API） | 回归点：完整版未被路由使用 |
| `/app/workbench/:id` | 未注册 | `pages/workbench/WorkbenchPage.tsx`（V2 迁移） | PRD §7 P0 路由 |
| `/app/templates/manage` | 未注册 | （不实现） | 决定用 `pages/TemplatesPage.tsx` embedded 模式 |

### 3.2 V3 路由清单（13 业务 + 6 系统 = 19 总）

```
/login                              # LoginPage
/register                           # RegisterPage
/app                                # DashboardPage
/app/competitors                    # CompetitorsPage (V3 增量)
/app/insights                       # InsightsPage (Mock)
/app/inbox                          # InboxPage (V3 路由修复)
/app/link-collect                   # LinkCollectPage (V3 增量)
/app/batch-collect                  # BatchCollectPage (V3 增量)
/app/title-optimization             # TitleOptimizationPage (V2 迁移)
/app/title-optimizer-v2             # TitleOptimizerV2 (V3 增量)
/app/workbench/:id                  # WorkbenchPage (V2 迁移 + 挂载)
/app/templates                      # TemplatesPage
/app/rules                          # RulesPage (+ PlatformRulesMatrix)
/app/publish                        # PublishPage (+ V2 特性)
/app/settings                       # SettingsPage
/app/settings/themes                # ThemeSettingsV2
/app/settings/themes/market         # ThemeMarketplace (V3.1)
/app/integrations                   # IntegrationsPage (V3 增量)
/app/team                           # TeamPage (V3 增量)
```

---

## 4. V2 支撑模块去留

| 文件 | 大小 | 去留 | 理由 |
|------|------|------|------|
| `v2/nav.ts` | 1.7 KB | **保留** | AppLayout 引用 `v3NavGroups` |
| `v2/types.ts` | 4.0 KB | **保留** | 被 `useV2Queries` 依赖 |
| `v2/api.ts` | 4.3 KB | **保留** | 间接被 `useV2Queries` 依赖 |
| `v2/api-local.ts` | 12.0 KB | **保留** | `v2/api.ts` 在 mock 模式下用 |
| `v2/hooks/useV2Queries.ts` | 5.5 KB | **保留** | `InsightsAttachPanel` 用 `useV2Competitors` |
| `v2/components/V2Shell.tsx` | 0.9 KB | **删除** | 仅 V2 pages 用 |
| `v2/components/MockBadge.tsx` | 0.3 KB | **删除** | 仅 V2 pages 用 |
| `v2/components/StatusChip.tsx` | 0.8 KB | **删除** | 仅 V2 pages 用 |
| `v2/components/PlatformRulesMatrix.tsx` | 1.7 KB | **迁移** | → `components/rules/PlatformRulesMatrix.tsx` |
| `v2/components/RequirementModuleGrid.tsx` | 1.3 KB | **删除** | 仅 DashboardV2Page 用 |
| `v2/config/requirementModules.ts` | 3.1 KB | **删除** | 仅 RequirementModuleGrid 用 |
| `v2/pages/index.ts` (barrel) | 0 | **删除** | 无外部引用 |

---

## 5. 检查清单（v3.0 收尾后必跑）

```bash
# 1. V2 pages 残留
grep -r "from.*v2/pages" web/src/        # 应 0
grep -r "from.*v2/components" web/src/    # 应 0（PlatformRulesMatrix 移新位置后）

# 2. V2 components 残留
grep -r "from.*V2Shell" web/src/          # 应 0
grep -r "from.*MockBadge" web/src/        # 应 0
grep -r "from.*StatusChip" web/src/       # 应 0
grep -r "from.*RequirementModuleGrid" web/src/  # 应 0

# 3. v2/nav.ts 仍被引用
grep -r "v3NavGroups\|v2/nav" web/src/    # 至少 1 行（AppLayout）

# 4. 路由 1:1 匹配
grep -c "<Route path" web/src/App.tsx     # 19（13 业务 + 6 系统）

# 5. 完整版 InboxPage 路由生效
grep "InboxPage" web/src/App.tsx          # 应引用 pages/InboxPage 而非 pages/inbox/InboxPage
```

---

## 6. 风险与缓解

| 风险 | 缓解 |
|------|------|
| V2 迁移破坏现有依赖 | 迁移后立即 `npx tsc --noEmit` + `npm test` |
| 路由修复导致用户丢失链接 | 内部重定向：旧 `/app/inbox` 子页自动跳新版本 |
| 平台规则矩阵合并冲突 | V2 组件独立文件 + V3 组件目录，便于回滚 |

---

*文档结束 — V2_VS_V3_MIGRATION.md*
