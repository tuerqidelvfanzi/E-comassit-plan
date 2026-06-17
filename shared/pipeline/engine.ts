/**
 * 处理管线核心（Web / API 共用）
 * @see docs/ARCHITECTURE.md
 */

export type TargetLocale = 'vi-VN' | 'th-TH';

export type PipelineInput = {
  title: string;
  priceCny: number;
  targetLocale: TargetLocale;
  promptNote?: string;
};

export type LocalizedOutput = {
  title: string;
  priceLabel: string;
};

export type PipelineResult = {
  exposure: LocalizedOutput;
  conversion: LocalizedOutput;
  ranAt: string;
  promptNote?: string;
};

export type PricingRule = {
  locale: TargetLocale;
  multiplier: number;
  symbol: string;
};

/**
 * BRD v1.1 §7.1 定价规则
 * - 越南 Shopee: 原价 x 3.5
 * - 泰国 TikTok: 原价 x 2.5
 * - 菲律宾 Shopee: 固定 ₱500（见 marketPricing.ts fixedPrice）
 */
export const PRICING_RULES: PricingRule[] = [
  { locale: 'vi-VN', multiplier: 3.5, symbol: '₫' },
  { locale: 'th-TH', multiplier: 2.5, symbol: '฿' },
];

/**
 * BRD v1.1 §8 违禁内容检查清单
 * - 品牌类（防侵权）：Nike/Adidas/Disney/LV/Gucci/Chanel/Hermes/Apple/Samsung/Huawei/NASA
 * - 国内标识：3C认证/产地/发货地/品牌名称（除非无品牌）
 * - 极限词：最好/第一/100%/根治/绝对/顶级/最强
 * - 图片敏感：终身质保/免费退货/包邮/免费开票/厂家介绍/关于我们/证书资质/运输售后
 */
const BLACKLIST_BRAND = [
  'Nike', 'Adidas', 'Disney', 'LV', 'Gucci', 'Chanel', '爱马仕', 'Hermes',
  'Apple', 'Samsung', '华为', 'Huawei', 'NASA', '耐克', '阿迪达斯',
];

const BLACKLIST_EXTREME = [
  '最好', '第一', '100%', '根治', '绝对', '顶级', '最强', '最佳',
  '完美', '极致', '独家', '全网', '唯一', '无敌',
];

const BLACKLIST_IMAGE_TEXT = [
  '终身质保', '免费退货', '包邮', '免费开票', '厂家介绍',
  '关于我们', '证书资质', '运输售后', '终身包换',
];

export const BLACKLIST = [...BLACKLIST_BRAND, ...BLACKLIST_EXTREME];

/** 检查文本是否包含违禁词 */
export function checkBlacklist(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const word of BLACKLIST) {
    if (lower.includes(word.toLowerCase())) {
      found.push(word);
    }
  }
  return found;
}

export function formatMoney(n: number) {
  const rounded = Math.round(n);
  return rounded.toLocaleString('en-US');
}

export function applyPricing(priceCny: number, locale: TargetLocale) {
  const rule = PRICING_RULES.find((r) => r.locale === locale) ?? PRICING_RULES[0];
  const calculated = priceCny * rule.multiplier;
  const label = `${rule.symbol}${formatMoney(calculated)}`;
  return { label, calculated, rule };
}

export function stripBlacklist(text: string) {
  let out = text;
  for (const w of BLACKLIST) {
    // 忽略大小写替换
    const regex = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    out = out.replace(regex, '');
  }
  return out.trim().replace(/\s+/g, ' ');
}

export function truncateTitle(title: string, maxLen = 20) {
  const t = title.trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen);
}

function mockTranslate(title: string, mode: 'exposure' | 'conversion', locale: TargetLocale) {
  const vi = locale === 'vi-VN';
  const clean = stripBlacklist(title);
  if (mode === 'exposure') {
    return vi ? `🔥 ${clean.slice(0, 24)} hot trend` : `🔥 ${clean.slice(0, 24)} ขายดี`;
  }
  const short = clean.replace(/\s+/g, '').slice(0, 18);
  return vi ? `đầm bé gái ${short}` : `ชุดเด็ก ${short}`;
}

/** 规则 + 模拟翻译；API 可注入 llmTranslate 替换 mock */
export function runPipeline(
  input: PipelineInput,
  options?: {
    llmTranslate?: (text: string, mode: 'exposure' | 'conversion', locale: TargetLocale) => Promise<string>;
  },
): Promise<PipelineResult> {
  const translate = options?.llmTranslate ?? (async (text, mode, locale) => mockTranslate(text, mode, locale));
  const { label: priceLabel } = applyPricing(input.priceCny, input.targetLocale);

  return Promise.all([
    translate(input.title, 'exposure', input.targetLocale),
    translate(input.title, 'conversion', input.targetLocale),
  ]).then(([exposureRaw, conversionRaw]) => {
    let conversionTitle = truncateTitle(conversionRaw, 20);
    if (input.promptNote?.trim()) {
      const extra = ` · ${input.promptNote.trim().slice(0, 8)}`;
      conversionTitle = truncateTitle(conversionTitle + extra, 20);
    }
    return {
      exposure: { title: exposureRaw, priceLabel },
      conversion: { title: conversionTitle, priceLabel },
      ranAt: new Date().toISOString(),
      promptNote: input.promptNote,
    };
  });
}
