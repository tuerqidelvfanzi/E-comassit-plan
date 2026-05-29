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

export const PRICING_RULES: PricingRule[] = [
  { locale: 'vi-VN', multiplier: 3500 * 2.5, symbol: '₫' },
  { locale: 'th-TH', multiplier: 5.2 * 1.8, symbol: '฿' },
];

const BLACKLIST = ['最好', '第一', '100%', '根治', '绝对'];

export function formatMoney(n: number) {
  return Math.round(n).toLocaleString('en-US');
}

export function applyPricing(priceCny: number, locale: TargetLocale) {
  const rule = PRICING_RULES.find((r) => r.locale === locale) ?? PRICING_RULES[0];
  return { label: `${rule.symbol}${formatMoney(priceCny * rule.multiplier)}`, rule };
}

export function stripBlacklist(text: string) {
  let out = text;
  for (const w of BLACKLIST) {
    out = out.split(w).join('');
  }
  return out.trim();
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
