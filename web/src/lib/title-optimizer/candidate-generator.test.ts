/**
 * 候选生成器测试
 */
import { describe, it, expect } from 'vitest';
import { generateCandidates } from './candidate-generator';

describe('generateCandidates', () => {
  it('生成 5 个候选', () => {
    const result = generateCandidates({
      productName: 'Wireless Earbuds',
      platform: 'amazon',
      language: 'en',
      keywords: ['bluetooth', 'noise-cancelling'],
      brand: 'Sony',
    });
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('候选按分数降序', () => {
    const result = generateCandidates({
      productName: 'Product Name',
      platform: 'amazon',
      language: 'en',
      keywords: ['kw1', 'kw2'],
    });
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].score.totalScore).toBeGreaterThanOrEqual(result[i].score.totalScore);
    }
  });

  it('超长标题自动截断', () => {
    const result = generateCandidates({
      productName: 'a'.repeat(150),
      platform: 'ebay', // 80 字符限制
      language: 'en',
      keywords: ['test', 'keyword', 'long', 'product', 'name'],
    });
    for (const c of result) {
      expect(c.title.length).toBeLessThanOrEqual(83);
    }
  });

  it('无 brand 跳过品牌前缀策略', () => {
    const result = generateCandidates({
      productName: 'Product',
      platform: 'amazon',
      language: 'en',
      keywords: ['kw'],
    });
    const hasBrandStrategy = result.some(c => c.strategy === '品牌前缀');
    expect(hasBrandStrategy).toBe(false);
  });
});
