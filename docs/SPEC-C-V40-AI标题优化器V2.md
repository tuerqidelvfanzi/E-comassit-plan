# SPEC-C: V4.0 AI 标题优化器 V2

> **轨道**: C | **类型**: 多语言 + 平台适配 + SEO
> **创建日期**: 2026-06-02 | **状态**: 📐 SPEC 阶段

---

## 1. 架构

```
V4.0 标题优化器 V2
├── 1. 数据层
│   ├── types/title-optimize.ts (新增)
│   └── lib/title-optimizer/ (新增)
│       ├── platform-rules.ts
│       ├── language-detector.ts
│       ├── seo-scorer.ts
│       ├── candidate-generator.ts
│       └── competitor-fetcher.ts
├── 2. API 层
│   ├── POST /api/v1/title/optimize
│   ├── POST /api/v1/title/batch
│   └── GET  /api/v1/title/competitors
├── 3. UI 组件
│   ├── pages/TitleOptimizerV2.tsx (新增)
│   ├── components/title/PlatformSelector.tsx
│   ├── components/title/SeoScoreCard.tsx
│   ├── components/title/CandidateList.tsx
│   └── components/title/BatchUpload.tsx
└── 4. 工具
    └── lib/translation/deepl-client.ts
```

## 2. 数据模型

```typescript
// web/src/types/title-optimize.ts
export type Platform = 'amazon' | 'ebay' | 'shopee' | 'tiktok' | 'lazada';
export type Language = 'zh' | 'en' | 'ja' | 'ko' | 'es' | 'fr';

export interface PlatformRule {
  maxLength: number;
  minLength: number;
  allowEmoji: boolean;
  allowAllCaps: boolean;
  brandPrefixRequired: boolean;
  separator: string;
  bannedTerms: string[];
}

export interface TitleOptimizeRequest {
  productName: string;
  platform: Platform;
  language: Language;
  keywords: string[];
  brand?: string;
  category?: string;
  competitorUrls?: string[];
}

export interface TitleCandidate {
  title: string;
  scores: {
    density: number;      // 0-100
    length: number;       // 0-100
    diversity: number;    // 0-100
    keywordPosition: number; // 0-100
  };
  totalScore: number;
  highlights: string[];   // 评分高亮理由
  warnings: string[];     // 平台规则违反
}

export interface TitleOptimizeResponse {
  candidates: TitleCandidate[];
  recommendedIndex: number;
  reasoning: string;
  detectedLanguage?: Language;
  platformRule: PlatformRule;
  competitorAnalysis?: CompetitorGap[];
}

export interface CompetitorGap {
  url: string;
  title: string;
  missingKeywords: string[];
  uniqueKeywords: string[];
}
```

## 3. 平台规则库

```typescript
// web/src/lib/title-optimizer/platform-rules.ts
export const PLATFORM_RULES: Record<Platform, PlatformRule> = {
  amazon: {
    maxLength: 200,
    minLength: 30,
    allowEmoji: false,
    allowAllCaps: true,
    brandPrefixRequired: true,
    separator: ' - ',
    bannedTerms: ['best', 'guaranteed', '#1'],
  },
  ebay: {
    maxLength: 80,
    minLength: 20,
    allowEmoji: false,
    allowAllCaps: false,
    brandPrefixRequired: false,
    separator: ' ',
    bannedTerms: ['buy now', 'limited time'],
  },
  shopee: {
    maxLength: 100,
    minLength: 15,
    allowEmoji: true,
    allowAllCaps: true,
    brandPrefixRequired: false,
    separator: ' | ',
    bannedTerms: [],
  },
  tiktok: {
    maxLength: 150,
    minLength: 20,
    allowEmoji: true,
    allowAllCaps: true,
    brandPrefixRequired: false,
    separator: ' | ',
    bannedTerms: [],
  },
  lazada: {
    maxLength: 255,
    minLength: 20,
    allowEmoji: false,
    allowAllCaps: true,
    brandPrefixRequired: false,
    separator: ' - ',
    bannedTerms: [],
  },
};
```

## 4. SEO 评分算法

```typescript
// web/src/lib/title-optimizer/seo-scorer.ts
export function scoreTitle(
  title: string,
  keywords: string[],
  rule: PlatformRule
): TitleCandidate {
  const density = scoreDensity(title, keywords);
  const length = scoreLength(title, rule);
  const diversity = scoreDiversity(title, keywords);
  const position = scoreKeywordPosition(title, keywords);
  
  const total = (
    density * 0.3 +
    length * 0.2 +
    diversity * 0.2 +
    position * 0.3
  );
  
  return {
    title,
    scores: { density, length, diversity, keywordPosition: position },
    totalScore: Math.round(total),
    highlights: generateHighlights(title, keywords, rule),
    warnings: validatePlatformRule(title, rule),
  };
}
```

## 5. 候选生成

```typescript
// web/src/lib/title-optimizer/candidate-generator.ts
export function generateCandidates(
  req: TitleOptimizeRequest,
  count: number = 5
): TitleCandidate[] {
  const rule = PLATFORM_RULES[req.platform];
  const candidates: TitleCandidate[] = [];
  
  // 策略 1: 关键词前置
  candidates.push(scoreTitle(
    prependKeywords(req.productName, req.keywords, rule),
    req.keywords, rule
  ));
  
  // 策略 2: 品牌前缀
  if (req.brand) {
    candidates.push(scoreTitle(
      `${req.brand}${rule.separator}${req.productName}`,
      req.keywords, rule
    ));
  }
  
  // 策略 3: 关键词后置
  candidates.push(scoreTitle(
    appendKeywords(req.productName, req.keywords, rule),
    req.keywords, rule
  ));
  
  // 策略 4-5: LLM 增强（生产期）
  // candidates.push(...await llmGenerate(req));
  
  return candidates.sort((a, b) => b.totalScore - a.totalScore).slice(0, count);
}
```

## 6. 竞品抓取

```typescript
// web/src/lib/title-optimizer/competitor-fetcher.ts
export async function fetchCompetitorTitles(
  urls: string[],
  platform: Platform
): Promise<CompetitorGap[]> {
  // 使用 Playwright（已有依赖）
  const results = await Promise.allSettled(
    urls.map(url => scrapeTitle(url, platform))
  );
  
  return results
    .filter((r): r is PromiseFulfilledResult<CompetitorGap> => r.status === 'fulfilled')
    .map(r => r.value);
}
```

## 7. UI 流程

```
+----------------------------------+
| Step 1: 输入产品信息              |
| 产品名: [__________]              |
| 关键词: [__, __, __]              |
+----------------------------------+
              ↓
+----------------------------------+
| Step 2: 选择平台/语言             |
| 平台: [Amazon ▾]  语言: [EN ▾]   |
+----------------------------------+
              ↓
+----------------------------------+
| Step 3: 生成候选（5 个）          |
| 1. [标题] 评分 95  ✓推荐          |
| 2. [标题] 评分 88                 |
| ...                              |
+----------------------------------+
              ↓
+----------------------------------+
| Step 4: 评分详情                  |
| 密度 90 | 长度 80 | 多样 70      |
| 建议: ...                        |
+----------------------------------+
              ↓
+----------------------------------+
| Step 5: 导出（CSV/复制/分享）     |
+----------------------------------+
```

## 8. 验收对照表（v3.0 基线同步）

> **同步日期**：2026-06-10
> **同步来源**：[REQUIREMENTS_V3.md](./REQUIREMENTS_V3.md) §10.1、`web/src/lib/title-optimizer/*`、`web/src/pages/TitleOptimizerV2.tsx`

| SPEC | 验收点 | v3.0 状态 | 证据 |
|------|-------|----------|------|
| 6 平台规则 | `platform-rules.ts` 含 amazon/ebay/shopee/tiktok/lazada 等 | ✅ | `PLATFORM_RULES` 字典 + `platform-rules.test.ts` |
| 语言检测 | `language-detector.ts` | ✅ | `language-detector.test.ts` 通过 |
| SEO 评分（4 维度） | `seo-scorer.ts` density/length/diversity/position | ✅ | `seo-scorer.test.ts` |
| 5 候选 | `candidate-generator.ts` 多策略 | ✅ | `candidate-generator.test.ts` |
| 竞品抓取 | `competitor-fetcher.ts` Playwright | ✅ 库实装 | `competitor-fetcher.test.ts`（无 API 端点） |
| 批量上传 | `batch-optimizer.ts` | ✅ 库实装 | `batch-optimizer.test.ts`（无 API 端点） |
| 单元测试 | 6 个 lib + 6 个 .test.ts | ✅ 29 单测 | vitest 全部通过 |
| E2E 测试 | 5 步流程 | ⚠️ 无 | v3.0 跳过 E2E |
| UI 集成 | `pages/TitleOptimizerV2.tsx` 7.3 KB | ✅ | 路由 `/app/title-optimizer-v2` 可访问 |
| **API 端点** | POST/GET /api/v1/title/* | ⏳ v3.1 延期 | 见 §10 |

## 9. 风险

- 翻译 API 限流 → 队列 + 缓存
- 评分主观性 → A/B 测试反馈

---

## 10. 延期项（v3.1 实施）

> **决策**：ADR-007 — 标题优化器 API 端点 v3.0 文档标记延期至 v3.1。
> **日期**：2026-06-10

### 10.1 待实施 API 端点

- [ ] `POST /api/v1/title/optimize` — 单商品标题优化
- [ ] `POST /api/v1/title/batch` — 批量标题优化
- [ ] `GET /api/v1/title/competitors` — 竞品标题抓取

### 10.2 延期原因

v3.0 阶段 `pages/TitleOptimizerV2.tsx` 全部由本地 `lib/title-optimizer/*` 6 个 lib 驱动评分与候选生成：
- `platform-rules.ts` — 平台规则字典（前端直接 import）
- `seo-scorer.ts` — 评分函数（前端 import）
- `candidate-generator.ts` — 候选生成（前端 import）
- `language-detector.ts` — 语言检测（前端 import）
- `competitor-fetcher.ts` — 竞品抓取（前端 import；当前为 mock）
- `batch-optimizer.ts` — 批量优化（前端 import）

**当前无后端调用依赖**。v3.1 再行实施（需后端 `api/` 目录新建 Hono 路由）。

### 10.3 验收门槛（v3.1）

- 3 个端点全部 Hono 路由实现
- 前端 `pages/TitleOptimizerV2.tsx` 切换为 fetch 调用
- 单元测试 + 集成测试覆盖
- 与 worker 队列对接

---

*文档结束 — V4.0 AI 标题优化器 SPEC（v3.0 同步版）*
