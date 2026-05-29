/**
 * 与插件、API、Worker 统一的采集契约。
 * @see docs/COLLECT_SCHEMA.md
 * @see shared/schemas/normalized-product.schema.json
 * @coupling extension/content/shared/normalize.js
 */
export const COLLECT_SCHEMA_VERSION = '1.0.0';

export type ExtractLayer = 'L1' | 'L2' | 'L4';
export type ExtractMethod = 'json_embed' | 'json_ld' | 'dom';

export type NormalizedSku = {
  id: string;
  name: string;
  price?: number;
};

export type NormalizedProduct = {
  source: string;
  sourceUrl: string;
  title: string;
  price: { amount: number; currency: string };
  images: string[];
  skus: NormalizedSku[];
  attributes: Record<string, unknown>;
  capturedAt: string;
  extractMethod?: ExtractMethod;
  extractLayer?: ExtractLayer;
};

export function isNormalizedProduct(data: unknown): data is NormalizedProduct {
  if (!data || typeof data !== 'object') return false;
  const d = data as NormalizedProduct;
  return typeof d.title === 'string' && typeof d.sourceUrl === 'string';
}
