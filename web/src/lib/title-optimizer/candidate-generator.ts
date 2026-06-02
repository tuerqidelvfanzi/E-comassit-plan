/**
 * 候选生成器 - 多策略生成 3-5 个候选标题
 */
import { scoreTitle, type TitleScore } from './seo-scorer';
import { getRule, type Platform, type Language } from './platform-rules';

export interface TitleCandidate {
  title: string;
  score: TitleScore;
  strategy: string;
}

export interface GenerateRequest {
  productName: string;
  platform: Platform;
  language: Language;
  keywords: string[];
  brand?: string;
  category?: string;
}

function prependKeywords(productName: string, keywords: string[], separator: string): string {
  return keywords.slice(0, 3).join(separator) + separator + productName;
}

function appendKeywords(productName: string, keywords: string[], separator: string): string {
  return productName + separator + keywords.slice(0, 3).join(separator);
}

function withBrand(brand: string, productName: string, separator: string): string {
  return brand + separator + productName;
}

function midKeywords(productName: string, keywords: string[], separator: string): string {
  // 关键词插在产品名中间
  const parts = productName.split(/\s+/);
  if (parts.length < 2) return appendKeywords(productName, keywords, separator);
  const mid = Math.floor(parts.length / 2);
  return parts.slice(0, mid).join(' ') + separator + keywords[0] + separator + parts.slice(mid).join(' ');
}

export function generateCandidates(req: GenerateRequest, count: number = 5): TitleCandidate[] {
  const rule = getRule(req.platform);
  const candidates: TitleCandidate[] = [];

  const strategies = [
    {
      name: '关键词前置',
      gen: () => prependKeywords(req.productName, req.keywords, rule.separator),
    },
    {
      name: '关键词后置',
      gen: () => appendKeywords(req.productName, req.keywords, rule.separator),
    },
    {
      name: '品牌前缀',
      gen: () => req.brand ? withBrand(req.brand, req.productName, rule.separator) : null,
    },
    {
      name: '关键词中插',
      gen: () => req.keywords.length > 0 ? midKeywords(req.productName, req.keywords, rule.separator) : null,
    },
    {
      name: '简化版',
      gen: () => req.productName + (req.keywords.length > 0 ? rule.separator + req.keywords[0] : ''),
    },
  ];

  for (const strategy of strategies) {
    if (candidates.length >= count) break;
    const title = strategy.gen();
    if (!title) continue;
    if (title.length > rule.maxLength) {
      // 截断
      const truncated = title.substring(0, rule.maxLength - 3) + '...';
      candidates.push({
        title: truncated,
        score: scoreTitle(truncated, req.keywords, rule),
        strategy: strategy.name + '(截断)',
      });
    } else {
      candidates.push({
        title,
        score: scoreTitle(title, req.keywords, rule),
        strategy: strategy.name,
      });
    }
  }

  return candidates.sort((a, b) => b.score.totalScore - a.score.totalScore);
}
