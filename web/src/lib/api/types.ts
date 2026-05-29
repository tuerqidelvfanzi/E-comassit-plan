export type ProductStatus = 'raw' | 'processing' | 'ready' | 'published';
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

export type PublishTask = {
  id: string;
  platform: 'Shopee' | 'TikTok Shop' | '淘宝';
  title: string;
  status: 'pending' | 'completed' | 'failed';
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

export type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};
