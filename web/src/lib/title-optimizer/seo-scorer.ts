/**
 * SEO 评分器 - 4 维度评分
 * 密度 30% + 长度 20% + 多样性 20% + 关键词位置 30%
 */
import type { PlatformRule } from './platform-rules';

export interface Scores {
  density: number;
  length: number;
  diversity: number;
  keywordPosition: number;
}

export interface TitleScore {
  scores: Scores;
  totalScore: number;
  highlights: string[];
  warnings: string[];
}

function scoreDensity(title: string, keywords: string[]): number {
  if (keywords.length === 0) return 100;
  const lowerTitle = title.toLowerCase();
  let hits = 0;
  let totalChars = 0;
  for (const kw of keywords) {
    const lowerKw = kw.toLowerCase();
    const re = new RegExp(lowerKw, 'gi');
    const matches = lowerTitle.match(re);
    if (matches) {
      hits += matches.length;
      totalChars += matches.reduce((a, m) => a + m.length, 0);
    }
  }
  const ratio = totalChars / title.length;
  // 理想密度 8-15%
  if (ratio < 0.02) return 30;
  if (ratio < 0.05) return 60;
  if (ratio <= 0.15) return 95;
  if (ratio <= 0.25) return 80;
  if (ratio <= 0.35) return 60;
  return 40;
}

function scoreLength(title: string, rule: PlatformRule): number {
  const len = title.length;
  if (len < rule.minLength) {
    return Math.max(0, Math.round((len / rule.minLength) * 60));
  }
  if (len > rule.maxLength) {
    return Math.max(0, 100 - Math.round(((len - rule.maxLength) / rule.maxLength) * 100));
  }
  // 理想: 在 70%-90% 范围内
  const target = (rule.minLength + rule.maxLength) * 0.8;
  const distance = Math.abs(len - target) / target;
  return Math.round(100 - distance * 30);
}

function scoreDiversity(title: string, keywords: string[]): number {
  const tokens = title.split(/[\s\-,|]+/).filter(t => t.length > 0);
  if (tokens.length === 0) return 0;
  const unique = new Set(tokens.map(t => t.toLowerCase()));
  const ratio = unique.size / tokens.length;
  // 至少有关键词数量 + 3
  const hasEnough = unique.size >= keywords.length + 2;
  return Math.round(ratio * 70 + (hasEnough ? 30 : 0));
}

function scoreKeywordPosition(title: string, keywords: string[]): number {
  if (keywords.length === 0) return 100;
  const lowerTitle = title.toLowerCase();
  const len = title.length;
  let totalPos = 0;
  for (const kw of keywords) {
    const idx = lowerTitle.indexOf(kw.toLowerCase());
    if (idx === -1) {
      totalPos += 1; // 完全缺失最差
    } else {
      // 越靠前越好
      totalPos += idx / len;
    }
  }
  const avgPos = totalPos / keywords.length;
  // 位置越靠前分越高
  return Math.round((1 - avgPos) * 100);
}

export function scoreTitle(title: string, keywords: string[], rule: PlatformRule): TitleScore {
  const scores: Scores = {
    density: scoreDensity(title, keywords),
    length: scoreLength(title, rule),
    diversity: scoreDiversity(title, keywords),
    keywordPosition: scoreKeywordPosition(title, keywords),
  };

  const totalScore = Math.round(
    scores.density * 0.3 +
    scores.length * 0.2 +
    scores.diversity * 0.2 +
    scores.keywordPosition * 0.3
  );

  const highlights: string[] = [];
  if (scores.density >= 90) highlights.push('关键词密度理想');
  if (scores.length >= 90) highlights.push('长度符合平台规则');
  if (scores.diversity >= 80) highlights.push('词汇多样性高');
  if (scores.keywordPosition >= 80) highlights.push('关键词前置');

  const warnings: string[] = [];
  if (title.length > rule.maxLength) warnings.push('超过平台最大长度 ' + rule.maxLength);
  if (title.length < rule.minLength) warnings.push('低于建议最小长度 ' + rule.minLength);
  if (!rule.allowAllCaps && title === title.toUpperCase()) warnings.push('禁止全大写');
  for (const banned of rule.bannedTerms) {
    if (title.toLowerCase().includes(banned.toLowerCase())) {
      warnings.push('包含禁止词: ' + banned);
    }
  }

  return { scores, totalScore, highlights, warnings };
}
