# 业务需求追溯矩阵

> 版本：v1.0 · 2026-05-30  
> 来源：`docs/BUSINESS_REQUIREMENTS_DEV.md` v1.1  
> 实现规格：`docs/LISTING_PUBLISH_IMPLEMENTATION.md`

状态图例：**done** = 纯函数/文档已落地 · **planned** = 已规格化待实现 · **n/a** = 不在当前范围

---

## 1. 核心流程

| ID | BRD 需求 | 文档章节 | 代码路径 | 状态 |
|----|----------|----------|----------|------|
| BRD-1.1 | 选品：源平台筛选爆款 | BRD §2 | `web/src/pages/InboxPage.tsx` | planned |
| BRD-1.2 | 采集：插件 9–12 图 + SKU | BRD §2 | `extension/content/`、`docs/COLLECT_SCHEMA.md` | planned |
| BRD-1.3 | 优化：LLM 标题描述本地化 | BRD §2 | `shared/pipeline/engine.ts` | planned |
| BRD-1.4 | 搬家：插件自动填表草稿 | BRD §2 | `extension/content/publish-fill.js` | planned |

---

## 2. 越南 Shopee 上品

| ID | BRD 需求 | 文档章节 | 代码路径 | 状态 |
|----|----------|----------|----------|------|
| BRD-3.1 | 13 步上品流程 | LISTING §5.1 | — | planned |
| BRD-3.2 | 标题越南语 ≤20 字符 | LISTING §3.4、§11 | `shared/listing/titleRules.ts` | done |
| BRD-3.2a | 汉字压缩到 9–10 字警告 | LISTING §11 | `titleRules.validateTitle()` | done |
| BRD-3.3 | SKU 售价 ×350% | LISTING §3.4 | `shared/listing/marketPricing.ts` `vn-shopee` | done |
| BRD-3.3a | 库存统一 50 | LISTING §3.4 | `marketPricing.getDefaultStock('vn-shopee')` | done |
| BRD-3.4 | 图片 9 张 1:1 800px | LISTING §4.1 | `shared/listing/imageRules.ts` | done |
| BRD-3.4a | 消除笔敏感内容 | LISTING §6 | `imageRules.scanSensitiveContent()` | done |
| BRD-3.4b | 中→越图片翻译 | LISTING §7.3 | `contracts.ts` `translate_overlay` | planned |

---

## 3. 泰国 TikTok 上品

| ID | BRD 需求 | 文档章节 | 代码路径 | 状态 |
|----|----------|----------|----------|------|
| BRD-4.1 | 10 步 TikTok 流程 | LISTING §5.2 | — | planned |
| BRD-4.1a | 主图最少 5 张 | LISTING §4.1 | `imageRules.validateImageSet('tiktok-th')` | done |
| BRD-4.2 | 五段 SKU 编码 | LISTING §3.3 | `shared/listing/skuEncoder.ts` | done |
| BRD-4.3 | 颜色编码表 WH/BK/RD… | LISTING §3.3 | `skuEncoder.COLOR_CODES` | done |
| BRD-4.4 | White Hook 单款式占位 | LISTING §3.3 | `skuEncoder.encodeDummyHookSku()` | done |
| BRD-4.4a | Hook 价400/库存5/重220g | LISTING §3.3 | `categoryTemplates` dummyHook | done |
| BRD-4.1b | 品牌 No Brand | LISTING §3.5 | `tiktokDefaults.NO_BRAND` | done |
| BRD-4.1c | 详情图 4 槽固定顺序 | LISTING §4.1 | `tiktokDefaults.DETAIL_IMAGE_SEQUENCE` | done |

---

## 4. 数据模型

| ID | BRD 需求 | 文档章节 | 代码路径 | 状态 |
|----|----------|----------|----------|------|
| BRD-5.1 | Product 字段扩展 | LISTING §3.5 | `web/src/lib/api/types.ts` | planned |
| BRD-5.1a | targetLocale id-ID/fil-PH | LISTING §3.4 | `marketPricing.MARKET_PRICING_RULES` | done |
| BRD-5.1b | hasVariants/skuCount/imageCount | BRD §9 | — | planned |
| BRD-5.2 | ProductImage.sensitiveContent | LISTING §4.1 | `imageRules.SENSITIVE_IMAGE_KEYWORDS` | done |
| BRD-5.2a | ProductImage.status 流水线 | LISTING §7.3 | `imageRules.ImagePipelineStage` | done |
| BRD-5.3 | ProductSku.weight/patternSuffix/isDummyHook | LISTING §3.5 | `skuEncoder.ParsedSku` | done |
| BRD-5.4 | ProcessedResult 双指标 | BRD §5.4 | `shared/pipeline/engine.ts` | planned |
| BRD-5.5 | ProcessedOutput.shortDescription/charCount | LISTING §3.5 | `titleRules.countTitleChars()` | done |

---

## 5. 类目模板

| ID | BRD 需求 | 文档章节 | 代码路径 | 状态 |
|----|----------|----------|----------|------|
| BRD-6.1 | 8 种 tpl-* 模板 | LISTING §4.1 | `shared/listing/categoryTemplates.ts` | done |
| BRD-6.2 | 服装-T恤 SkuConfig | LISTING §3.3 | `CATEGORY_TEMPLATES['tpl-clothing-tshirt']` | done |
| BRD-6.3 | 越南 Shopee 模板叠加 | LISTING §11 | `SHOPEE_VN_TEMPLATE_OVERRIDES` | done |
| BRD-6.x | 模板 CRUD UI | BRD §10 P1 | `web/src/pages/TemplatesPage.tsx` | planned |

---

## 6. 定价 / 库存 / 重量

| ID | BRD 需求 | 文档章节 | 代码路径 | 状态 |
|----|----------|----------|----------|------|
| BRD-7.1 | 越南 Shopee ×3.5 | LISTING §3.4 | `calcListPrice(_, 'vn-shopee')` | done |
| BRD-7.1a | 泰国 TikTok ×2.5 | LISTING §3.4 | `calcListPrice(_, 'th-tiktok')` | done |
| BRD-7.1b | 菲律宾 Shopee 固定500 | LISTING §3.4 | `calcListPrice(_, 'ph-shopee')` | done |
| BRD-7.2 | 越南库存50 / 菲律宾800 | LISTING §3.4 | `getDefaultStock()` | done |
| BRD-7.3 | 默认重量 220g | LISTING §3.4 | `getDefaultWeightGrams()` | done |

---

## 7. 违禁内容

| ID | BRD 需求 | 文档章节 | 代码路径 | 状态 |
|----|----------|----------|----------|------|
| BRD-8.1 | 图片敏感内容清单 | LISTING §6 | `imageRules.SENSITIVE_IMAGE_KEYWORDS` | done |
| BRD-8.2 | 品牌违禁词 | LISTING §6 | `antiBan.scanBannedTerms()` | done |
| BRD-8.2a | 国内标识 3C/产地/发货地 | LISTING §6 | `antiBan` BANNED_TERMS | done |
| BRD-8.x | 面料 Cotton/Polyester 防封 | LISTING §6 | `antiBan.scanAntiBan()` | done |

---

## 8. 待开发功能（BRD §10）

| ID | BRD 需求 | 文档章节 | 代码路径 | 状态 |
|----|----------|----------|----------|------|
| BRD-10-P0-1 | 商品采集 Extension | BRD §10 | `extension/` | done |
| BRD-10-P0-2 | 采集箱 InboxPage | BRD §10 | `web/src/pages/InboxPage.tsx` | done |
| BRD-10-P0-3 | 工作台 WorkbenchPage | BRD §10 | `web/src/pages/WorkbenchPage.tsx` | done |
| BRD-10-P0-4 | 发布任务 PublishPage | BRD §10 | `web/src/pages/PublishPage.tsx` | done |
| BRD-10-P0-5 | 插件填表 | BRD §10 | `extension/content/publish-fill.js` | done |
| BRD-10-P1-1 | 模板管理 TemplatesPage | BRD §10 | `web/src/pages/TemplatesPage.tsx` | done |
| BRD-10-P1-2 | SKU 变体编辑 | BRD §10 | WorkbenchPage + skuEncoder | planned |
| BRD-10-P1-3 | 图片处理 UI | BRD §10 | WorkbenchPage | done |
| BRD-10-P1-4 | 批量采集 BatchCollectPage | BRD §10 | `web/src/pages/BatchCollectPage.tsx` | done |

---

## 9. 扩展需求（实现规格 Phase 2）

| ID | 需求 | 文档章节 | 代码路径 | 状态 |
|----|------|----------|----------|------|
| EXT-1 | GMV/CTR 选品筛选 | LISTING §4.1 | `shared/listing/productFilters.ts` | done |
| EXT-2 | Redis link catcher 契约 | LISTING §7.1 | `contracts.ts` LinkCatcher* | done |
| EXT-3 | ADS Power gate | LISTING §7.2 | `contracts.evaluateAdsPowerGate()` | done |
| EXT-4 | AI 图片 pipeline 配置 | LISTING §7.3 | `contracts.DEFAULT_AI_IMAGE_CONFIG` | done |
| EXT-5 | Token/计费挂钩 | LISTING §7.4 | `contracts.BillingHook` | done |
| EXT-6 | Redis 运行时 API | LISTING §9 | `api/src/app.ts` | planned |
| EXT-7 | ADS Power 运行时 | LISTING §9 | `extension/background/adsPowerBridge.js` | planned |
| EXT-8 | 计费持久化 API | LISTING §9 | `POST /billing/hooks` | planned |

---

## 10. 统计摘要

| 状态 | 数量 |
|------|------|
| done | 38 |
| planned | 22 |
| n/a | 0 |

最后更新：2026-05-30 · 随 `shared/listing/*` 与 BRD 变更同步维护。
