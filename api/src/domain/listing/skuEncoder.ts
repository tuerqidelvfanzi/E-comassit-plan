/**
 * 服装-T恤 SKU 六段编码（需求文档：谷歌报告2 + 上品实操PPT）
 * 格式：{PREFIX}-{SEQUENCE}-{SIDE}-{COLOR}-{SIZE}+{后缀}
 * 示例：BF-0001-PR-WH-S+B (白底黑花) / BF-0001-PR-WH-S-H (黑底白花)
 * +B = 白底黑花 (White base + Black print)
 * +H = 黑底白花 (Black base + White print)
 */

export const SKU_DEFAULT_PREFIX = 'BF';

/** 印花后缀：B=白底黑花，H=黑底白花 */
export const PRINT_VARIANTS = ['B', 'H'] as const;
export type PrintVariant = (typeof PRINT_VARIANTS)[number];

export const PRINT_VARIANT_LABELS: Record<PrintVariant, string> = {
  B: '白底黑花 (+B)',
  H: '黑底白花 (+H)',
};

/** BRD §4.3 颜色编码表（2 字母） */
export const COLOR_CODES: Record<string, string> = {
  白色: 'WH',
  white: 'WH',
  WH: 'WH',
  黑色: 'BK',
  black: 'BK',
  BK: 'BK',
  红色: 'RD',
  red: 'RD',
  RD: 'RD',
  蓝色: 'BL',
  blue: 'BL',
  BL: 'BL',
  绿色: 'GR',
  green: 'GR',
  GR: 'GR',
  黄色: 'YL',
  yellow: 'YL',
  YL: 'YL',
  粉色: 'PK',
  pink: 'PK',
  PK: 'PK',
  紫色: 'PU',
  purple: 'PU',
  PU: 'PU',
  橙色: 'OR',
  orange: 'OR',
  OR: 'OR',
  灰色: 'GY',
  gray: 'GY',
  grey: 'GY',
  GY: 'GY',
};

/** 正反面编码：P=正面有图案，R=背面，PR=正反面都有 */
export const PATTERN_SIDES = ['P', 'R', 'PR'] as const;
export type PatternSide = (typeof PATTERN_SIDES)[number];

export type SkuEncodeInput = {
  prefix?: string;
  sequence: number;
  side: PatternSide;
  color: string;
  size: string;
  /** 印花后缀：B=白底黑花，H=黑底白花 */
  printVariant?: PrintVariant;
};

export type SkuEncodeResult = {
  success: boolean;
  skuCode?: string;
  error?: string;
};

export type ParsedSku = {
  prefix: string;
  sequence: number;
  side: PatternSide;
  colorCode: string;
  size: string;
  printVariant?: PrintVariant;
  isDummyHook: boolean;
};

/** 六段格式正则：支持 +B / +H 后缀 */
const SKU_PATTERN = /^([A-Z0-9]+)-(\d{4})-(P|R|PR)-([A-Z]{2})-([A-Z0-9]+)(\+[BH])?$/;

export function resolveColorCode(color: string): string | undefined {
  const key = color.trim();
  return COLOR_CODES[key] ?? COLOR_CODES[key.toLowerCase()];
}

export function formatSequence(sequence: number): string {
  const n = Math.max(1, Math.min(1000, Math.floor(sequence)));
  return String(n).padStart(4, '0');
}

export function encodeSku(input: SkuEncodeInput): string {
  const prefix = (input.prefix ?? SKU_DEFAULT_PREFIX).trim().toUpperCase();
  const colorCode = resolveColorCode(input.color);
  if (!colorCode) {
    throw new Error(`UNKNOWN_COLOR: ${input.color}`);
  }
  const size = input.size.trim().toUpperCase();
  if (!size) {
    throw new Error('SIZE_REQUIRED');
  }
  if (!PATTERN_SIDES.includes(input.side)) {
    throw new Error(`INVALID_SIDE: ${input.side}`);
  }
  const seq = formatSequence(input.sequence);
  const variantSuffix = input.printVariant ? `+${input.printVariant}` : '';
  return `${prefix}-${seq}-${input.side}-${colorCode}-${size}${variantSuffix}`;
}

/** 安全编码：返回结果对象而非抛出异常 */
export function tryEncodeSku(input: SkuEncodeInput): SkuEncodeResult {
  try {
    const skuCode = encodeSku(input);
    return { success: true, skuCode };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'UNKNOWN_ERROR' };
  }
}

/** BRD §4.4 白色钩子：单款式占位变体 */
export function encodeDummyHookSku(prefix: string, size: string): string {
  return `${prefix.trim().toUpperCase()}-9999-P-WH-${size.trim().toUpperCase()}`;
}

export function parseSku(code: string): ParsedSku | null {
  const m = code.trim().match(SKU_PATTERN);
  if (!m) return null;
  const sequence = Number(m[2]);
  const printVariant = m[6] ? (m[6].replace('+', '') as PrintVariant) : undefined;
  return {
    prefix: m[1],
    sequence,
    side: m[3] as PatternSide,
    colorCode: m[4],
    size: m[5],
    printVariant,
    isDummyHook: sequence === 9999 && m[3] === 'P' && m[4] === 'WH',
  };
}

/**
 * 判断印花后缀类型
 * @param variant B=白底黑花，H=黑底白花
 */
export function getPrintVariantLabel(variant?: PrintVariant): string {
  if (!variant) return '';
  return PRINT_VARIANT_LABELS[variant] || variant;
}
