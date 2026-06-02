/**
 * SEO 评分器测试
 */
import { describe, it, expect } from 'vitest';
import { scoreTitle } from './seo-scorer';
import { PLATFORM_RULES } from './platform-rules';

const amazonRule = PLATFORM_RULES.amazon;

describe('scoreTitle', () => {
  it('理想标题获高分', () => {
    const title = 'Premium Wireless Earbuds - Bluetooth 5.0 Headphones - Noise Cancelling - Long Battery Life';
    const result = scoreTitle(title, ['wireless', 'bluetooth', 'earbuds'], amazonRule);
    expect(result.totalScore).toBeGreaterThan(70);
    expect(result.warnings).toHaveLength(0);
  });

  it('超过最大长度触发警告', () => {
    const longTitle = 'a'.repeat(250);
    const result = scoreTitle(longTitle, ['test'], amazonRule);
    expect(result.warnings.some(w => w.includes('超过'))).toBe(true);
  });

  it('含禁止词触发警告', () => {
    const title = 'Best Wireless Earbuds Guaranteed Quality';
    const result = scoreTitle(title, ['wireless'], amazonRule);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('无关键词时密度默认 100', () => {
    const result = scoreTitle('Any Title Here', [], amazonRule);
    expect(result.scores.density).toBe(100);
  });

  it('总评分在 0-100 范围', () => {
    const tests = [
      ['短', 'a'],
      ['中', 'a'.repeat(50)],
      ['长', 'a'.repeat(300)],
    ];
    for (const [, t] of tests) {
      const r = scoreTitle(t, ['test'], amazonRule);
      expect(r.totalScore).toBeGreaterThanOrEqual(0);
      expect(r.totalScore).toBeLessThanOrEqual(100);
    }
  });
});
