import { describe, expect, it } from 'vitest';
import { applyPricing, runPipeline, stripBlacklist, truncateTitle } from './engine.js';

describe('pipeline engine', () => {
  it('applies VN pricing', () => {
    const { label } = applyPricing(10, 'vi-VN');
    expect(label).toMatch(/^₫/);
    expect(label).toContain('87,500');
  });

  it('strips blacklist words', () => {
    expect(stripBlacklist('最好纯棉裙')).toBe('纯棉裙');
  });

  it('truncates title to 20 chars', () => {
    expect(truncateTitle('一二三四五六七八九零一二三四五六七八九零', 20).length).toBeLessThanOrEqual(20);
  });

  it('returns exposure and conversion outputs', async () => {
    const result = await runPipeline({
      title: '韩版童装连衣裙',
      priceCny: 28.5,
      targetLocale: 'vi-VN',
    });
    expect(result.exposure.title.length).toBeGreaterThan(0);
    expect(result.conversion.title.length).toBeLessThanOrEqual(20);
    expect(result.exposure.priceLabel).toMatch(/^₫/);
  });
});
