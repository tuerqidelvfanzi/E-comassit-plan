/**
 * 东南亚市场定价、库存、重量默认值（BRD v1.1 §7）
 */

export type TargetMarket = 'vn-shopee' | 'th-tiktok' | 'ph-shopee' | 'id-shopee';

export type MarketPricingRule = {
  market: TargetMarket;
  platform: 'Shopee' | 'TikTok Shop';
  locale: string;
  multiplier?: number;
  fixedPrice?: number;
  defaultStock: number;
  defaultWeightGrams: number;
  titleMaxChars?: number;
};

export const MARKET_PRICING_RULES: Record<TargetMarket, MarketPricingRule> = {
  'vn-shopee': {
    market: 'vn-shopee',
    platform: 'Shopee',
    locale: 'vi-VN',
    multiplier: 3.5,
    defaultStock: 50,
    defaultWeightGrams: 220,
    titleMaxChars: 20,
  },
  'th-tiktok': {
    market: 'th-tiktok',
    platform: 'TikTok Shop',
    locale: 'th-TH',
    multiplier: 2.5,
    defaultStock: 50,
    defaultWeightGrams: 220,
  },
  'ph-shopee': {
    market: 'ph-shopee',
    platform: 'Shopee',
    locale: 'fil-PH',
    fixedPrice: 500,
    defaultStock: 800,
    defaultWeightGrams: 220,
  },
  'id-shopee': {
    market: 'id-shopee',
    platform: 'Shopee',
    locale: 'id-ID',
    multiplier: 3.5,
    defaultStock: 50,
    defaultWeightGrams: 220,
    titleMaxChars: 20,
  },
};

export function calcListPrice(costCny: number, market: TargetMarket): number {
  const rule = MARKET_PRICING_RULES[market];
  if (rule.fixedPrice != null) return rule.fixedPrice;
  const mult = rule.multiplier ?? 1;
  return Math.round(costCny * mult * 100) / 100;
}

export function getDefaultStock(market: TargetMarket): number {
  return MARKET_PRICING_RULES[market].defaultStock;
}

export function getDefaultWeightGrams(market: TargetMarket): number {
  return MARKET_PRICING_RULES[market].defaultWeightGrams;
}
