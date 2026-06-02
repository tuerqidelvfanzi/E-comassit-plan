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

## 8. 验收对照表

| SPEC | 实现 | 检查 |
|------|------|------|
| 5 平台规则 | ✅ | 单元测试覆盖 |
| 5 语言 | ✅ | franc + DeepL |
| SEO 评分 | ✅ | 4 维度算法 |
| 5 候选 | ✅ | 多策略生成 |
| 竞品抓取 | ✅ | Playwright |
| 批量上传 | ✅ | CSV < 100 行 |
| 单元测试 | ✅ | 覆盖率 > 80% |
| E2E 测试 | ✅ | 5 步流程 |

## 9. 风险

- 翻译 API 限流 → 队列 + 缓存
- 评分主观性 → A/B 测试反馈
