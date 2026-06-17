/**
 * @deprecated 采集数据已迁入 prototypeDb；保留兼容导出。
 */
import type { NormalizedProduct } from './collectTypes';
import { ingestNormalized, getProducts, subscribeDb, type StoredProduct } from './prototypeDb';
import type { Product } from './mock';

export type CapturedProduct = StoredProduct;

const IMPORT_EVENT = 'psa-inbox-import';

export function subscribeInbox(cb: () => void) {
  const unsub = subscribeDb(cb);
  window.addEventListener(IMPORT_EVENT, cb);
  return () => {
    unsub();
    window.removeEventListener(IMPORT_EVENT, cb);
  };
}

export function getDemoInboxItems(): CapturedProduct[] {
  return getProducts().filter((p) => p.fromExtension);
}

export function addDemoInboxItem(payload: NormalizedProduct): CapturedProduct {
  const item = ingestNormalized(payload);
  if (!item) throw new Error('invalid payload');
  window.dispatchEvent(new Event(IMPORT_EVENT));
  return item;
}

export function decodeDemoImport(encoded: string): CapturedProduct | null {
  try {
    const data = JSON.parse(decodeURIComponent(encoded)) as unknown;
    const item = ingestNormalized(data);
    if (item) window.dispatchEvent(new Event(IMPORT_EVENT));
    return item;
  } catch {
    return null;
  }
}

export function mergeInboxWithMock(_mockProducts: Product[]): CapturedProduct[] {
  return getProducts();
}
