import { describe, expect, it } from 'vitest';
import { calcListPrice, getDefaultStock, MARKET_PRICING_RULES } from './marketPricing.js';

describe('marketPricing', () => {
  it('applies Vietnam Shopee x3.5', () => {
    expect(calcListPrice(100, 'vn-shopee')).toBe(350);
  });

  it('applies Thailand TikTok x2.5', () => {
    expect(calcListPrice(100, 'th-tiktok')).toBe(250);
  });

  it('applies Philippines fixed 500', () => {
    expect(calcListPrice(999, 'ph-shopee')).toBe(500);
  });

  it('returns Vietnam default stock 50', () => {
    expect(getDefaultStock('vn-shopee')).toBe(50);
  });

  it('returns Philippines default stock 800', () => {
    expect(getDefaultStock('ph-shopee')).toBe(800);
  });

  it('includes id-ID locale', () => {
    expect(MARKET_PRICING_RULES['id-shopee'].locale).toBe('id-ID');
  });
});
