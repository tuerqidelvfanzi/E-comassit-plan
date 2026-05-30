/** @see shared/listing/tiktokDefaults.ts — keep in sync */
import { PRINT_VARIANT_SUFFIX } from './skuEncoder.js';

export const TIKTOK_PRICE_MULTIPLIER = 3.5;

export const NO_BRAND = 'No Brand';

export const LOGISTICS_DEFAULTS = {
  weightKg: 0.3,
  lengthCm: 30,
  widthCm: 25,
  heightCm: 2,
  shippingTemplateId: 'standard_economy',
  warehouseCode: 'DEFAULT',
} as const;

export const WHITE_HOOK_VARIANT = {
  id: 'white-hook',
  label: 'White Hook 白钩款',
  skuSuffix: 'WH',
  printVariant: 'whiteOnBlack' as const,
  allowPolyesterListing: true,
  listingMaterial: 'Polyester',
  attributeOverrides: {
    brand: NO_BRAND,
    material: 'Polyester',
  },
} as const;

export const DETAIL_IMAGE_SEQUENCE = [
  { slot: 1, assetKey: 'size_chart', label: '尺码表' },
  { slot: 2, assetKey: 'fabric_detail', label: '面料细节' },
  { slot: 3, assetKey: 'model_front', label: '模特正面' },
  { slot: 4, assetKey: 'selling_points', label: '卖点/场景图' },
] as const;

export type DetailImageSlot = (typeof DETAIL_IMAGE_SEQUENCE)[number];

export function calcTikTokListPrice(costCny: number, multiplier = TIKTOK_PRICE_MULTIPLIER): number {
  return Math.round(costCny * multiplier * 100) / 100;
}

export function buildTikTokSkuSuffix(isWhiteHook: boolean): string {
  if (isWhiteHook) return WHITE_HOOK_VARIANT.skuSuffix;
  return PRINT_VARIANT_SUFFIX.whiteOnBlack;
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
