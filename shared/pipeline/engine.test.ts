import { describe, expect, it } from 'vitest';
import {
  applyPricing,
  runPipeline,
  stripBlacklist,
  truncateTitle,
  checkBlacklist,
  PRICING_RULES,
} from './engine.js';

describe('pipeline engine', () => {
  describe('applyPricing', () => {
    it('applies VN pricing with correct multiplier (BRD §7.1)', () => {
      const { label, calculated } = applyPricing(10, 'vi-VN');
      expect(calculated).toBe(35); // 10 * 3.5 = 35
      expect(label).toBe('₫35');
    });

    it('applies TH pricing with correct multiplier (BRD §7.1)', () => {
      const { label, calculated } = applyPricing(10, 'th-TH');
      expect(calculated).toBe(25); // 10 * 2.5 = 25
      expect(label).toBe('฿25');
    });

    it('has correct multipliers per BRD', () => {
      const vnRule = PRICING_RULES.find((r) => r.locale === 'vi-VN');
      const thRule = PRICING_RULES.find((r) => r.locale === 'th-TH');
      expect(vnRule?.multiplier).toBe(3.5);
      expect(thRule?.multiplier).toBe(2.5);
    });
  });

  describe('stripBlacklist', () => {
    it('removes extreme words', () => {
      expect(stripBlacklist('最好纯棉裙')).toBe('纯棉裙');
      expect(stripBlacklist('第一品牌T恤')).toBe('品牌T恤');
    });

    it('removes brand names (BRD §8.2)', () => {
      expect(stripBlacklist('Nike运动鞋')).toBe('运动鞋');
      expect(stripBlacklist('Adidas连衣裙')).toBe('连衣裙');
    });

    it('handles case insensitively', () => {
      expect(stripBlacklist('nike运动鞋')).toBe('运动鞋');
    });
  });

  describe('checkBlacklist', () => {
    it('detects extreme words', () => {
      const found = checkBlacklist('这是最好的纯棉裙');
      expect(found).toContain('最好');
    });

    it('detects brand names', () => {
      const found = checkBlacklist('Nike运动鞋');
      expect(found).toContain('Nike');
    });

    it('returns empty for clean text', () => {
      const found = checkBlacklist('纯棉儿童连衣裙');
      expect(found.length).toBe(0);
    });
  });

  describe('truncateTitle', () => {
    it('truncates to max length', () => {
      expect(truncateTitle('一二三四五六七八九零一二三四五六七八九零', 20).length).toBeLessThanOrEqual(20);
    });

    it('keeps short titles unchanged', () => {
      expect(truncateTitle('纯棉T恤', 20)).toBe('纯棉T恤');
    });
  });

  describe('runPipeline', () => {
    it('returns exposure and conversion outputs', async () => {
      const result = await runPipeline({
        title: '韩版童装连衣裙',
        priceCny: 28.5,
        targetLocale: 'vi-VN',
      });
      expect(result.exposure.title.length).toBeGreaterThan(0);
      expect(result.conversion.title.length).toBeLessThanOrEqual(20);
      expect(result.exposure.priceLabel).toBe('₫100'); // 28.5 * 3.5 = 99.75 -> 100
    });

    it('uses THB currency for Thailand', async () => {
      const result = await runPipeline({
        title: '儿童防晒外套',
        priceCny: 44.8,
        targetLocale: 'th-TH',
      });
      expect(result.exposure.priceLabel).toBe('฿112'); // 44.8 * 2.5 = 112
    });
  });
});
