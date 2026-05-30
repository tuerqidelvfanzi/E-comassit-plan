/**
 * 快速原型：浏览器 localStorage 作为唯一数据源（无真实后端）。
 * 生产环境应替换为 REST API；见 docs/ARCHITECTURE.md
 */
import type { NormalizedProduct } from './collectTypes';
import { isNormalizedProduct } from './collectTypes';
import type {
  InsightItem,
  Product,
  ProductStatus,
  PublishTask,
  RuleItem,
  TemplateItem,
} from './mock';
import {
  mockInsights,
  mockProducts,
  mockPublishTasks,
  mockRules,
  mockTemplates,
} from './mock';

const DB_KEY = 'psa_prototype_v1';
const LEGACY_INBOX_KEY = 'psa_inbox_demo';
const DB_EVENT = 'psa-db-change';

export type ProcessedOutput = {
  exposure: { title: string; priceLabel: string };
  conversion: { title: string; priceLabel: string };
  ranAt: string;
  promptNote?: string;
};

export type StoredProduct = Product & {
  capturedAt?: string;
  fromExtension?: boolean;
  extractLayer?: string;
  extractMethod?: string;
  images?: string[];
  skus?: NormalizedProduct['skus'];
  attributes?: Record<string, unknown>;
  rawCapture?: NormalizedProduct;
  processed?: ProcessedOutput;
  pipelineNote?: string;
};

export type CollectJob = {
  id: string;
  status: 'queued' | 'done' | 'failed';
  sourceUrl: string;
  productId?: string;
  createdAt: string;
  error?: string;
};

export type PipelineRun = {
  id: string;
  productId: string;
  status: 'running' | 'done' | 'failed';
  startedAt: string;
  finishedAt?: string;
};

export type InsightJob = {
  id: string;
  status: 'idle' | 'running' | 'done';
  keywords: InsightItem[];
  topFeatures: string[];
  updatedAt: string;
};

export type LocalBatchJob = {
  id: string;
  status: 'queued' | 'running' | 'done' | 'failed' | 'paused';
  listUrl: string;
  maxItems: number;
  delayMsMin: number;
  delayMsMax: number;
  useCookies: boolean;
  itemsDone: number;
  itemsFailed: number;
  results: Array<{ url: string; ok: boolean; productId?: string; error?: string }>;
  auditLog: Array<Record<string, unknown>>;
  error?: string | null;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
};

type DbShape = {
  version: 1;
  products: StoredProduct[];
  templates: TemplateItem[];
  rules: RuleItem[];
  publishTasks: PublishTask[];
  collectJobs: CollectJob[];
  pipelineRuns: PipelineRun[];
  insight: InsightJob;
  extensionToken: string;
  batchJobs: LocalBatchJob[];
  cookieJars: Array<{ domain: string; updatedAt: string; consentAt: string }>;
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function defaultDb(): DbShape {
  return {
    version: 1,
    products: mockProducts.map((p) => ({ ...p })),
    templates: [...mockTemplates],
    rules: [...mockRules],
    publishTasks: [...mockPublishTasks],
    collectJobs: [],
    pipelineRuns: [],
    insight: {
      id: 'insight-1',
      status: 'done',
      keywords: [...mockInsights],
      topFeatures: ['主图：白底 + 模特正面', '标题：年龄段 + 材质 + 场景'],
      updatedAt: new Date().toISOString(),
    },
    extensionToken: generateToken(),
    batchJobs: [],
    cookieJars: [],
  };
}

export function generateToken() {
  return `psa_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function loadRaw(): DbShape {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return migrateOrSeed();
    const parsed = JSON.parse(raw) as DbShape;
    if (!parsed?.version || !Array.isArray(parsed.products)) return migrateOrSeed();
    return parsed;
  } catch {
    return migrateOrSeed();
  }
}

function migrateOrSeed(): DbShape {
  const db = defaultDb();
  try {
    const legacy = localStorage.getItem(LEGACY_INBOX_KEY);
    if (legacy) {
      const items = JSON.parse(legacy) as StoredProduct[];
      if (Array.isArray(items)) {
        const ids = new Set(db.products.map((p) => p.id));
        for (const item of items) {
          if (!ids.has(item.id)) db.products.unshift(item);
        }
      }
      localStorage.removeItem(LEGACY_INBOX_KEY);
    }
  } catch {
    /* ignore */
  }
  saveRaw(db);
  return db;
}

function saveRaw(db: DbShape) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  window.dispatchEvent(new Event(DB_EVENT));
}

export function subscribeDb(cb: () => void) {
  window.addEventListener(DB_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(DB_EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

export function getDb(): DbShape {
  return loadRaw();
}

export function getProducts(): StoredProduct[] {
  return loadRaw().products;
}

export function getProduct(id: string): StoredProduct | undefined {
  return getProducts().find((p) => p.id === id);
}

export function upsertProduct(product: StoredProduct) {
  const db = loadRaw();
  const idx = db.products.findIndex((p) => p.id === product.id);
  if (idx >= 0) db.products[idx] = product;
  else db.products.unshift(product);
  saveRaw(db);
}

export function updateProduct(id: string, patch: Partial<StoredProduct>) {
  const db = loadRaw();
  const idx = db.products.findIndex((p) => p.id === id);
  if (idx < 0) return;
  db.products[idx] = { ...db.products[idx], ...patch };
  saveRaw(db);
}

export function deleteProduct(id: string) {
  const db = loadRaw();
  db.products = db.products.filter((p) => p.id !== id);
  saveRaw(db);
}

export function getMetrics() {
  const products = getProducts();
  return {
    totalProducts: products.length,
    rawCount: products.filter((p) => p.status === 'raw').length,
    processingCount: products.filter((p) => p.status === 'processing').length,
    readyCount: products.filter((p) => p.status === 'ready').length,
    publishedCount: products.filter((p) => p.status === 'published').length,
  };
}

export function getTemplates() {
  return loadRaw().templates;
}

export function saveTemplates(templates: TemplateItem[]) {
  const db = loadRaw();
  db.templates = templates;
  saveRaw(db);
}

export function getRules() {
  return loadRaw().rules;
}

export function saveRules(rules: RuleItem[]) {
  const db = loadRaw();
  db.rules = rules;
  saveRaw(db);
}

export function getPublishTasks() {
  return loadRaw().publishTasks;
}

export function savePublishTasks(tasks: PublishTask[]) {
  const db = loadRaw();
  db.publishTasks = tasks;
  saveRaw(db);
}

export function getCollectJobs() {
  return loadRaw().collectJobs;
}

export function addCollectJob(job: CollectJob) {
  const db = loadRaw();
  db.collectJobs.unshift(job);
  saveRaw(db);
}

export function addPipelineRun(run: PipelineRun) {
  const db = loadRaw();
  db.pipelineRuns.unshift(run);
  if (db.pipelineRuns.length > 50) db.pipelineRuns.length = 50;
  saveRaw(db);
}

export function getPipelineRuns(productId?: string) {
  const runs = loadRaw().pipelineRuns;
  return productId ? runs.filter((r) => r.productId === productId) : runs;
}

export function getInsight() {
  return loadRaw().insight;
}

export function saveInsight(insight: InsightJob) {
  const db = loadRaw();
  db.insight = insight;
  saveRaw(db);
}

export function getExtensionToken() {
  return loadRaw().extensionToken;
}

export function rotateExtensionToken() {
  const db = loadRaw();
  db.extensionToken = generateToken();
  saveRaw(db);
  return db.extensionToken;
}

function placeholderThumb(source: string) {
  const label = encodeURIComponent(source.slice(0, 4) || 'NEW');
  return `https://placehold.co/80x80/073642/93a1a1?text=${label}`;
}

export function normalizedToProduct(data: NormalizedProduct): StoredProduct {
  const thumb = data.images?.[0] || placeholderThumb(data.source);
  return {
    id: uid('ext'),
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

export function ingestNormalized(data: unknown): StoredProduct | null {
  if (!isNormalizedProduct(data)) return null;
  const product = normalizedToProduct(data);
  const job: CollectJob = {
    id: uid('job'),
    status: 'done',
    sourceUrl: data.sourceUrl,
    productId: product.id,
    createdAt: new Date().toISOString(),
  };
  upsertProduct(product);
  addCollectJob(job);
  return product;
}

export function getBatchJobs() {
  return loadRaw().batchJobs;
}

export function saveBatchJobs(jobs: LocalBatchJob[]) {
  const db = loadRaw();
  db.batchJobs = jobs;
  saveRaw(db);
}

export function getCookieJars() {
  return loadRaw().cookieJars;
}

export function saveCookieJars(jars: Array<{ domain: string; updatedAt: string; consentAt: string }>) {
  const db = loadRaw();
  db.cookieJars = jars;
  saveRaw(db);
}

export function resetPrototypeData() {
  localStorage.removeItem(DB_KEY);
  migrateOrSeed();
}
