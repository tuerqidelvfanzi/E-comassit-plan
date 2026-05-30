/** B 站采集箱内部状态（DB / API 不变） */
export type ProductStatus = 'raw' | 'processing' | 'ready' | 'published';

/**
 * 平台侧上架状态（BRD 扩展，UI 展示用）
 * 映射：raw→pending, processing→draft, ready→reviewing, published→live
 * @see docs/LISTING_PUBLISH_IMPLEMENTATION.md §3.1
 */
export type ListingStatus = 'pending' | 'draft' | 'reviewing' | 'live' | 'suspended';

export const PRODUCT_TO_LISTING_STATUS: Record<ProductStatus, ListingStatus> = {
  raw: 'pending',
  processing: 'draft',
  ready: 'reviewing',
  published: 'live',
};
export type TargetLocale = 'vi-VN' | 'th-TH';

export type ProcessedOutput = {
  exposure: { title: string; priceLabel: string };
  conversion: { title: string; priceLabel: string };
  ranAt: string;
  promptNote?: string;
};

export type Product = {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  priceCny: number;
  status: ProductStatus;
  category: string;
  thumb: string;
  targetLocale: TargetLocale;
  capturedAt?: string;
  fromExtension?: boolean;
  extractLayer?: string;
  extractMethod?: string;
  images?: string[];
  skus?: unknown[];
  attributes?: Record<string, unknown>;
  rawCapture?: unknown;
  processed?: ProcessedOutput;
  pipelineNote?: string;
};

export type TemplateItem = {
  id: string;
  name: string;
  status: 'active' | 'draft';
  note: string;
  language: string;
  promptBody?: string;
};

export type RuleItem = {
  id?: string;
  name: string;
  expr: string;
  group: 'pricing' | 'title' | 'safety' | 'translation';
};

/** 发布任务状态：现有 API 三态 + BRD 扩展 draft/filling/cancelled */
export type PublishTaskStatus =
  | 'draft'
  | 'pending'
  | 'filling'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type PublishTask = {
  id: string;
  platform: 'Shopee' | 'TikTok Shop' | '淘宝';
  title: string;
  /** 兼容现有 API；完整流转见 LISTING_PUBLISH_IMPLEMENTATION.md */
  status: PublishTaskStatus | 'pending' | 'completed' | 'failed';
  reason?: string;
  productId?: string;
};

export type DashboardMetrics = {
  totalProducts: number;
  rawCount: number;
  processingCount: number;
  readyCount: number;
  publishedCount: number;
};

export type InsightState = {
  status: string;
  keywords: Array<{ keyword: string; score: number }>;
  topFeatures: string[];
  updatedAt?: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; username: string };
};

export type BatchCollectJob = {
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

export type CookieJarInfo = {
  domain: string;
  updatedAt: string;
  consentAt: string;
};

export type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};
