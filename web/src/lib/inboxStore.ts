import type { Product, ProductStatus } from './mock';

const STORAGE_KEY = 'psa_inbox_demo';
const IMPORT_EVENT = 'psa-inbox-import';

export type CapturedProduct = {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  priceCny: number;
  status: ProductStatus;
  category: string;
  thumb: string;
  targetLocale: 'vi-VN' | 'th-TH';
  capturedAt: string;
  fromExtension?: boolean;
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

export function addDemoInboxItem(payload: {
  title: string;
  source: string;
  sourceUrl: string;
  priceCny: number;
  category?: string;
}) {
  const item: CapturedProduct = {
    id: `ext-${Date.now()}`,
    title: payload.title,
    source: payload.source,
    sourceUrl: payload.sourceUrl,
    priceCny: payload.priceCny,
    status: 'raw',
    category: payload.category ?? '童装',
    thumb: `https://placehold.co/80x80/073642/93a1a1?text=NEW`,
    targetLocale: 'vi-VN',
    capturedAt: new Date().toISOString(),
    fromExtension: true,
  };
  const next = [item, ...loadDemo()];
  saveDemo(next);
  return item;
}

export function decodeDemoImport(encoded: string): CapturedProduct | null {
  try {
    const data = JSON.parse(decodeURIComponent(encoded)) as {
      title?: string;
      source?: string;
      sourceUrl?: string;
      price?: { amount?: number };
    };
    if (!data.title) return null;
    return addDemoInboxItem({
      title: data.title,
      source: data.source ?? '插件采集',
      sourceUrl: data.sourceUrl ?? '',
      priceCny: data.price?.amount ?? 0,
    });
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
