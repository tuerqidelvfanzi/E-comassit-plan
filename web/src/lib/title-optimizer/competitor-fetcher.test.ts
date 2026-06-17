import { describe, it, expect } from 'vitest';
import { analyzeGaps } from './competitor-fetcher';

describe('analyzeGaps', () => {
  it('正确分类匹配/缺失关键词', () => {
    const result = analyzeGaps(
      ['wireless', 'bluetooth', 'cheap'],
      { url: 'x', title: 'Premium Wireless Bluetooth Earbuds', length: 35, fetchTime: 0 }
    );
    expect(result.matchedKeywords).toContain('wireless');
    expect(result.matchedKeywords).toContain('bluetooth');
    expect(result.missingKeywords).toContain('cheap');
  });

  it('提取竞品独特词', () => {
    const result = analyzeGaps(
      ['wireless'],
      { url: 'x', title: 'Premium Wireless Noise Cancelling Premium Earbuds', length: 50, fetchTime: 0 }
    );
    // uniqueKeywords 保留原始大小写，断言时用小写比较
    const lowerUniques = result.uniqueKeywords.map(k => k.toLowerCase());
    expect(lowerUniques).toContain('noise');
    expect(lowerUniques).toContain('cancelling');
  });
});
