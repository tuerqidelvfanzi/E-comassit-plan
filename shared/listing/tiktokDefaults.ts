/**
 * TikTok Shop / 平台上架默认值（BRD v1.1 §4、§7）
 */

import { calcListPrice, getDefaultStock, getDefaultWeightGrams } from './marketPricing.js';
import { encodeDummyHookSku } from './skuEncoder.js';

/** @deprecated 使用 marketPricing calcListPrice('th-tiktok') — 泰国 TikTok 倍率 2.5 */
export const TIKTOK_PRICE_MULTIPLIER = 2.5;

export const NO_BRAND = 'No Brand';

export const LOGISTICS_DEFAULTS = {
  weightKg: 0.22,
  lengthCm: 30,
  widthCm: 25,
  heightCm: 2,
  shippingTemplateId: 'standard_economy',
  warehouseCode: 'DEFAULT',
} as const;

/** BRD §4.4 白色钩子变体 */
export const WHITE_HOOK_VARIANT = {
  id: 'white-hook',
  label: 'White Hook 白钩款',
  colorName: 'empty',
  price: 400,
  stock: 5,
  weightGrams: 220,
  allowPolyesterListing: true,
  listingMaterial: 'Polyester',
  attributeOverrides: {
    brand: NO_BRAND,
    material: 'Polyester',
  },
} as const;

/** 详情图固定 4 张顺序（TikTok 泰国 §4.1 步骤 9） */
export const DETAIL_IMAGE_SEQUENCE = [
  { slot: 1, assetKey: 'size_chart', label: '尺码表' },
  { slot: 2, assetKey: 'fabric_detail', label: '面料细节' },
  { slot: 3, assetKey: 'model_front', label: '模特正面' },
  { slot: 4, assetKey: 'selling_points', label: '卖点/场景图' },
] as const;

export type DetailImageSlot = (typeof DETAIL_IMAGE_SEQUENCE)[number];

export function calcTikTokListPrice(costCny: number, multiplier = TIKTOK_PRICE_MULTIPLIER): number {
  return calcListPrice(costCny, 'th-tiktok');
}

export function buildDummyHookSkuCode(prefix: string, size: string): string {
  return encodeDummyHookSku(prefix, size);
}

export function buildTikTokSkuSuffix(isWhiteHook: boolean): string {
  return isWhiteHook ? 'WH' : 'PR';
}

export function orderDetailImages<T extends { assetKey?: string; type?: string }>(
  images: T[],
  fixedAssets: Record<string, T>,
): T[] {
  const ordered: T[] = [];
  for (const slot of DETAIL_IMAGE_SEQUENCE) {
    const fixed = fixedAssets[slot.assetKey];
    if (fixed) ordered.push(fixed);
  }
  const used = new Set(ordered);
  for (const img of images) {
    if (!used.has(img)) ordered.push(img);
  }
  return ordered.slice(0, 4);
}

export { getDefaultStock, getDefaultWeightGrams };
