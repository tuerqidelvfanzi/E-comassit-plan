/**
 * 服装-T恤 SKU 编码（BRD 附录 B）
 * 格式：{PREFIX}{COLOR_CODE}{SIZE_CODE}{SEQUENCE}{VARIANT_SUFFIX}
 * 示例：01T-C10-M-G0012-B
 */

export const SKU_PREFIX_TSHIRT = '01T';

export const COLOR_CODES: Record<string, string> = {
  白色: 'C10',
  white: 'C10',
  黑色: 'C20',
  black: 'C20',
  红色: 'C30',
  red: 'C30',
  蓝色: 'C40',
  blue: 'C40',
  灰色: 'C50',
  gray: 'C50',
  grey: 'C50',
  绿色: 'C60',
  green: 'C60',
  黄色: 'C70',
  yellow: 'C70',
  粉色: 'C80',
  pink: 'C80',
  紫色: 'C90',
  purple: 'C90',
  橙色: 'CA0',
  orange: 'CA0',
};

/** 印花后缀：黑底白印花 H，白底黑印花 B */
export const PRINT_VARIANT_SUFFIX = {
  blackOnWhite: 'H',
  whiteOnBlack: 'B',
} as const;

export type PrintVariant = keyof typeof PRINT_VARIANT_SUFFIX;

export type SkuEncodeInput = {
  prefix?: string;
  color: string;
  size: string;
  sequence: number;
  variantSuffix?: string;
};

export type ParsedSku = {
  prefix: string;
  colorCode: string;
  sizeCode: string;
  sequence: number;
  variantSuffix: string;
};

const SKU_PATTERN = /^([A-Z0-9]+)-([A-Z]\d{2})-([A-Z0-9]+)-G(\d{4})-([A-Z0-9]+)$/;

export function resolveColorCode(color: string): string | undefined {
  const key = color.trim();
  return COLOR_CODES[key] ?? COLOR_CODES[key.toLowerCase()];
}

export function formatSequence(sequence: number): string {
  const n = Math.max(1, Math.min(9999, Math.floor(sequence)));
  return `G${String(n).padStart(4, '0')}`;
}

export function encodeSku(input: SkuEncodeInput): string {
  const prefix = input.prefix ?? SKU_PREFIX_TSHIRT;
  const colorCode = resolveColorCode(input.color);
  if (!colorCode) {
    throw new Error(`UNKNOWN_COLOR: ${input.color}`);
  }
  const sizeCode = input.size.trim().toUpperCase();
  if (!sizeCode) {
    throw new Error('SIZE_REQUIRED');
  }
  const seq = formatSequence(input.sequence);
  const suffix = input.variantSuffix ?? PRINT_VARIANT_SUFFIX.whiteOnBlack;
  return `${prefix}-${colorCode}-${sizeCode}-${seq}-${suffix}`;
}

export function parseSku(code: string): ParsedSku | null {
  const m = code.trim().match(SKU_PATTERN);
  if (!m) return null;
  return {
    prefix: m[1],
    colorCode: m[2],
    sizeCode: m[3],
    sequence: Number(m[4]),
    variantSuffix: m[5],
  };
}

export function variantSuffixForPrint(variant: PrintVariant): string {
  return PRINT_VARIANT_SUFFIX[variant];
}
