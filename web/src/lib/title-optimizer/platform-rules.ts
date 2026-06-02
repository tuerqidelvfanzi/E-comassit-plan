/**
 * 平台规则库 - 5 平台差异化约束
 * 来源: 各平台官方文档 + 实测
 */
export type Platform = 'amazon' | 'ebay' | 'shopee' | 'tiktok' | 'lazada';
export type Language = 'zh' | 'en' | 'ja' | 'ko' | 'es' | 'fr';

export interface PlatformRule {
  maxLength: number;
  minLength: number;
  allowEmoji: boolean;
  allowAllCaps: boolean;
  brandPrefixRequired: boolean;
  separator: string;
  bannedTerms: string[];
  notes: string;
}

export const PLATFORM_RULES: Record<Platform, PlatformRule> = {
  amazon: {
    maxLength: 200,
    minLength: 30,
    allowEmoji: false,
    allowAllCaps: true,
    brandPrefixRequired: true,
    separator: ' - ',
    bannedTerms: ['best', 'guaranteed', '#1', 'free shipping'],
    notes: '建议 品牌-产品-卖点-关键词 格式',
  },
  ebay: {
    maxLength: 80,
    minLength: 20,
    allowEmoji: false,
    allowAllCaps: false,
    brandPrefixRequired: false,
    separator: ' ',
    bannedTerms: ['buy now', 'limited time', '!!!'],
    notes: '严格 80 字符，无 ALL CAPS',
  },
  shopee: {
    maxLength: 100,
    minLength: 15,
    allowEmoji: true,
    allowAllCaps: true,
    brandPrefixRequired: false,
    separator: ' | ',
    bannedTerms: [],
    notes: '本地化语言，emoji 友好',
  },
  tiktok: {
    maxLength: 150,
    minLength: 20,
    allowEmoji: true,
    allowAllCaps: true,
    brandPrefixRequired: false,
    separator: ' | ',
    bannedTerms: [],
    notes: '短视频风格，吸睛关键词',
  },
  lazada: {
    maxLength: 255,
    minLength: 20,
    allowEmoji: false,
    allowAllCaps: true,
    brandPrefixRequired: false,
    separator: ' - ',
    bannedTerms: [],
    notes: '宽松长度限制，关键词堆砌风险',
  },
};

export function getRule(platform: Platform): PlatformRule {
  return PLATFORM_RULES[platform];
}
