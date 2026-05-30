/** V2 演示域类型（Mock 数据契约） */

export type V2Milestone = 'v2.0' | 'v2.1' | 'v2.2' | 'v2.3';

export type TargetLocale = 'vi-VN' | 'th-TH' | 'fil-PH' | 'id-ID';

export type SkuMode = 'A' | 'B' | 'C';

export type PublishStatusV2 =
  | 'draft'
  | 'pending'
  | 'filling'
  | 'completed'
  | 'failed';

export interface CompetitorJob {
  id: string;
  keyword: string;
  sourcePlatform: string;
  status: 'idle' | 'running' | 'done' | 'failed';
  createdAt: string;
  updatedAt: string;
  report?: CompetitorReport;
}

/** 源平台内「同类/类似」在售商品（未入库，供选品参考） */
export interface SimilarProductItem {
  title: string;
  priceCny: number;
  salesHint: string;
  sourceUrl: string;
  thumb: string;
}

export interface CompetitorReport {
  keywords: Array<{ word: string; count: number; score: number }>;
  priceRange: { min: number; max: number; currency: string };
  popularColors: string[];
  popularSizes: string[];
  sampleTitles: string[];
  gmvEstimate: string;
  ctrEstimate: string;
  /** 处理层·同源找类似款（Mock 爬虫） */
  similarProducts: SimilarProductItem[];
}

export type ShopeeVnStepId =
  | 'select_shop'
  | 'create_product'
  | 'upload_images'
  | 'title'
  | 'category'
  | 'sku_price_stock'
  | 'short_desc'
  | 'long_desc'
  | 'shipping'
  | 'weight'
  | 'package_size'
  | 'publish'
  | 'confirm';

export interface ShopeeVnChecklistStep {
  id: ShopeeVnStepId;
  label: string;
  done: boolean;
}

export interface LinkCollectJob {
  id: string;
  url: string;
  sourcePlatform: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  progress: number;
  message?: string;
  productPreview?: {
    title: string;
    priceCny: number;
    thumb: string;
    skuCount: number;
  };
  createdAt: string;
}

export interface TemplateCatalogItem {
  id: string;
  name: string;
  mode: SkuMode;
  category: string;
  locales: TargetLocale[];
  milestone: V2Milestone;
  description: string;
  skuPreview: string;
}

export interface PipelineRunV2 {
  id: string;
  productId: string;
  templateId: string;
  locale: TargetLocale;
  status: 'done';
  mock: true;
  exposure: {
    title: string;
    shortDescription: string;
    priceLabel: string;
  };
  conversion: {
    title: string;
    shortDescription: string;
    priceLabel: string;
  };
  skus: Array<{
    skuCode: string;
    color: string;
    size: string;
    printVariant?: 'B' | 'H';
    price: number;
    stock: number;
  }>;
  shopeeVnChecklist?: ShopeeVnChecklistStep[];
  warnings: string[];
  ranAt: string;
}

export interface PublishAdapter {
  id: string;
  platform: string;
  locale: TargetLocale;
  mode: 'dom_fill' | 'open_api';
  status: 'ready' | 'beta' | 'planned';
  milestone: V2Milestone;
  lastMockFillAt?: string;
}

export interface PublishTaskV2 {
  id: string;
  productId?: string;
  title: string;
  platform: string;
  locale: TargetLocale;
  status: PublishStatusV2;
  reason?: string;
  adapterId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: 'owner' | 'operator' | 'viewer';
  email: string;
  lastActiveAt: string;
}

export interface OpenApiIntegration {
  platform: string;
  locale: TargetLocale;
  status: 'connected' | 'disconnected' | 'mock';
  scopes: string[];
  quotaUsed: number;
  quotaLimit: number;
}

export interface V2Overview {
  milestone: string;
  mock: true;
  metrics: {
    totalProducts: number;
    competitorJobsDone: number;
    linkCollectDone: number;
    publishCompleted: number;
    templatesActive: number;
  };
  features: Array<{ id: string; label: string; milestone: V2Milestone; ready: boolean }>;
}

export interface InsightsDashboardV2 {
  keywords: Array<{ keyword: string; score: number; trend: 'up' | 'down' | 'stable' }>;
  gmvBands: Array<{ band: string; count: number }>;
  ctrBands: Array<{ band: string; count: number }>;
  competitorReports: Array<{ id: string; keyword: string; updatedAt: string }>;
  topFeatures: string[];
}
