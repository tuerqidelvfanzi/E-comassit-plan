# RES-C: AI 标题优化算法调研

> **轨道**: C | **目标**: 多语言 + 平台 + 评分

---

## 1. 多语言 NLP 库对比

| 库 | 语言 | 准确率 | 大小 | 维护 |
|---|------|--------|------|------|
| **compromise** | en | 中 | 250KB | ✅ |
| **node-nlp** | en/zh | 中 | 2MB | ✅ |
| **franc** | 多 | 75% | 100KB | ✅ |
| **Google Translate API** | 全 | 95%+ | 外部 | ✅ |
| **DeepL API** | 全 | 99% | 外部 | ✅ |

**选型**: **franc（语言检测）+ DeepL API（翻译）** ✅

## 2. 平台规则库

| 平台 | 字符限制 | 关键规则 |
|------|---------|---------|
| Amazon | 200 | 品牌前缀、大写、No emoji |
| eBay | 80 | No ALL CAPS、No 特殊字符 |
| Shopee | 100 | 本地化语言 |
| Tiktok Shop | 150 | 表情符号友好 |
| Lazada | 255 | 关键词堆砌风险 |

**数据来源**: 各平台官方文档

## 3. SEO 评分算法

```typescript
function scoreTitle(title, keywords, platform) {
  const scores = {
    density: calcDensity(title, keywords),     // 0-100
    length: calcLength(title, platform),       // 0-100
    diversity: calcDiversity(title),            // 0-100
    keywordPosition: calcPosition(title, keywords), // 0-100
  };
  const total = Object.values(scores).reduce((a, b) => a + b, 0) / 4;
  return { total, scores };
}
```

**权重**: density(0.3) + length(0.2) + diversity(0.2) + position(0.3)

## 4. 候选生成

- **策略 1**: 关键词前置/后置各生成 1
- **策略 2**: 不同模板（短/中/长）各生成 1
- **策略 3**: 同义词替换（用 LLM）
- **策略 4**: 用户自定义

输出 3-5 个候选，AI 排序推荐最佳。

## 5. 翻译 API 成本

| 服务 | 字符价格 | 月配额 |
|------|---------|--------|
| DeepL Free | ¥0 | 50万字符 |
| DeepL Pro | ¥20/百万 | 无限制 |
| Google Free | ¥0 | 50万字符 |
| 火山翻译 | ¥3.5/百万 | 按量 |

**选型**: **DeepL Free（开发期）+ 火山翻译（生产）** ✅

## 6. 竞品抓取

| 方案 | 风险 | 成本 |
|------|------|------|
| **Playwright（已用）** | 中 | 免费 |
| ScrapingBee | 低 | $0.10/1000 |
| ScraperAPI | 低 | $0.05/1000 |

**选型**: **Playwright + 限频（开发期）** ✅

## 7. 结论

零新依赖，复用 Playwright + 自研算法 + 第三方 API。
