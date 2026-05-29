import type { NormalizedProduct } from './collectTypes';
import { isNormalizedProduct } from './collectTypes';
import type { Product, ProductStatus } from './mock';

const STORAGE_KEY = 'psa_inbox_demo';
const IMPORT_EVENT = 'psa-inbox-import';

export type CapturedProduct = Product & {
  capturedAt: string;
  fromExtension?: boolean;
  extractLayer?: string;
  extractMethod?: string;
  images?: string[];
  skus?: NormalizedProduct['skus'];
  attributes?: Record<string, unknown>;
  rawCapture?: NormalizedProduct;
};

function loadDemo(): CapturedProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CapturedProduct[];
  } catch {
    return [];
  }
}

function saveDemo(items: CapturedProduct[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(IMPORT_EVENT));
}

export function subscribeInbox(cb: () => void) {
  window.addEventListener(IMPORT_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(IMPORT_EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

export function getDemoInboxItems(): CapturedProduct[] {
  return loadDemo();
}

function placeholderThumb(source: string) {
  const label = encodeURIComponent(source.slice(0, 4) || 'NEW');
  return `https://placehold.co/80x80/073642/93a1a1?text=${label}`;
}

export function normalizedToInboxItem(data: NormalizedProduct): CapturedProduct {
  const thumb = data.images?.[0] || placeholderThumb(data.source);
  return {
    id: `ext-${Date.now()}`,
    title: data.title,
    source: data.source,
    sourceUrl: data.sourceUrl,
    priceCny: data.price?.amount ?? 0,
    status: 'raw' as ProductStatus,
    category: '童装',
    thumb,
    targetLocale: 'vi-VN',
    capturedAt: data.capturedAt || new Date().toISOString(),
    fromExtension: true,
    extractLayer: data.extractLayer,
    extractMethod: data.extractMethod,
    images: data.images ?? [],
    skus: data.skus ?? [],
    attributes: data.attributes ?? {},
    rawCapture: data,
  };
}

export function addDemoInboxItem(payload: NormalizedProduct): CapturedProduct {
  const item = normalizedToInboxItem(payload);
  const next = [item, ...loadDemo()];
  saveDemo(next);
  return item;
}

export function decodeDemoImport(encoded: string): CapturedProduct | null {
  try {
    const data = JSON.parse(decodeURIComponent(encoded)) as unknown;
    if (!isNormalizedProduct(data)) return null;
    return addDemoInboxItem(data);
  } catch {
    return null;
  }
}

export function mergeInboxWithMock(mockProducts: Product[]): CapturedProduct[] {
  const demo = loadDemo();
  const mockIds = new Set(mockProducts.map((p) => p.id));
  const onlyDemo = demo.filter((d) => !mockIds.has(d.id));
  return [...onlyDemo, ...(mockProducts as CapturedProduct[])];
}
