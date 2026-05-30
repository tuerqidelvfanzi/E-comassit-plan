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
export type TargetLocale = 'vi-VN' | 'th-TH' | 'id-ID' | 'fil-PH';

/**
 * BRD v1.1 §5.2 ProductImage
 */
export type ProductImage = {
  id?: string;
  url: string;
  type: 'main' | 'detail' | 'sku';
  sort?: number;
  hasWatermark?: boolean;
  priceTag?: boolean;
  sensitiveContent?: string[];
  status?: 'pending' | 'downloaded' | 'processed' | 'translated';
};

/**
 * BRD v1.1 §5.3 ProductSku（六段编码支持）
 * 印花后缀：B=白底黑花，H=黑底白花
 */
export type PrintVariant = 'B' | 'H';

export type ProductSku = {
  id?: string;
  name: string;
  color: string;
  colorCode?: string;
  size: string;
  price: number;
  stock: number;
  weight?: number;
  skuCode?: string;
  patternSuffix?: 'P' | 'R' | 'PR';
  /** 印花后缀：B=白底黑花，H=黑底白花 */
  printVariant?: PrintVariant;
  isDummyHook?: boolean;
};

/**
 * BRD v1.1 §5.4 ProcessedOutput
 */
export type ProcessedOutput = {
  exposure: { title: string; priceLabel: string; shortDescription?: string };
  conversion: { title: string; priceLabel: string; shortDescription?: string };
  selectedOutput?: 'exposure' | 'conversion';
  ranAt: string;
  promptNote?: string;
  templateId?: string;
  modelUsed?: string;
};

/**
 * BRD v1.1 §5.1 Product (核心字段完整版)
 */
export type Product = {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  priceCny: number;
  status: ProductStatus;
  category: string;
  categoryId?: string;
  thumb: string;
  targetLocale: TargetLocale;
  capturedAt?: string;
  fromExtension?: boolean;
  extractLayer?: string;
  extractMethod?: string;
  /** 图片列表 */
  images?: string[] | ProductImage[];
  /** SKU 变体列表 */
  skus?: ProductSku[];
  /** 是否有变体 */
  hasVariants?: boolean;
  skuCount?: number;
  imageCount?: number;
  /** 商品属性 */
  attributes?: Record<string, unknown>;
  rawCapture?: unknown;
  processed?: ProcessedOutput;
  pipelineNote?: string;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * BRD v1.1 §6 类目模板（完整版）
 */
export type CategoryTemplateId =
  | 'tpl-clothing-tshirt'
  | 'tpl-clothing-general'
  | 'tpl-kitchenware'
  | 'tpl-lighting'
  | 'tpl-beauty'
  | 'tpl-electronics'
  | 'tpl-home'
  | 'tpl-other';

/** 白色钩子配置（BRD §4.4） */
export type DummyHookConfig = {
  enabled: boolean;
  colorName: string;
  price: number;
  stock: number;
  weight: number;
};

/** SKU 配置（BRD §4.2 六段编码，支持印花后缀） */
export type SkuConfig = {
  prefix: string;
  sequenceStart: number;
  colors: string[];
  sizes: string[];
  sides: Array<'P' | 'R' | 'PR'>;
  /** 支持的印花后缀：B=白底黑花，H=黑底白花 */
  printVariants?: PrintVariant[];
  dummyHook: DummyHookConfig;
};

/** 类目模板完整配置 */
export type CategoryTemplateConfig = {
  id: CategoryTemplateId;
  name: string;
  category: string;
  skuConfig?: SkuConfig;
  priceMultiplier?: number;
  titleMaxChars?: number;
  defaultStock?: number;
};

export type TemplateItem = {
  id: string;
  name: string;
  status: 'active' | 'draft';
  note: string;
  language: string;
  promptBody?: string;
  /** SKU 配置（仅服装类模板） */
  skuConfig?: SkuConfig;
  /** 模板分类 ID */
  categoryId?: CategoryTemplateId;
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

/** 物流配置默认值 */
export type LogisticsConfig = {
  shippingWeight: number;
  deliveryDays: number;
  freeReturn: boolean;
  /** 包裹尺寸（cm）：长×宽×高，菲律宾固定 10-5-10 */
  packageDimensions?: PackageDimensions;
};

export type PackageDimensions = {
  length: number;
  width: number;
  height: number;
};

/** 各市场包裹尺寸默认值（需求文档：上品实操PPT） */
export const DEFAULT_PACKAGE_DIMENSIONS: Record<TargetLocale, PackageDimensions> = {
  'vi-VN': { length: 10, width: 5, height: 10 },
  'th-TH': { length: 10, width: 5, height: 10 },
  'id-ID': { length: 10, width: 5, height: 10 },
  'fil-PH': { length: 10, width: 5, height: 10 },
};

export const LOGISTICS_DEFAULTS: LogisticsConfig = {
  shippingWeight: 220,
  deliveryDays: 3,
  freeReturn: true,
};

/**
 * BRD v1.1 §5.3 完整 SKU 填表数据
 */
export type PublishSku = {
  skuCode: string;
  color: string;
  size: string;
  price: number;
  stock: number;
  weight?: number;
  isDummyHook?: boolean;
};

/**
 * 发布填表 Payload（完整版）
 */
export type PublishFillPayload = {
  platform: 'tiktok' | 'taobao' | 'shopee';
  title: string;
  price: number;
  currency: string;
  stock: number;
  weightGrams: number;
  brand: string;
  /** SKU 变体列表（BRD §5.3） */
  skus?: PublishSku[];
  /** 物流配置 */
  logistics?: LogisticsConfig;
  /** 简要描述 */
  shortDescription?: string;
  /** 详细描述 */
  description?: string;
  /** 主图 URLs */
  imageUrls?: string[];
};

export type PublishTask = {
  id: string;
  platform: 'Shopee' | 'TikTok Shop' | '淘宝';
  title: string;
  /** 兼容现有 API；完整流转见 LISTING_PUBLISH_IMPLEMENTATION.md */
  status: PublishTaskStatus | 'pending' | 'completed' | 'failed';
  reason?: string;
  productId?: string;
  fillPayload?: PublishFillPayload;
  validation?: {
    ok: boolean;
    issues: string[];
    antiBan?: { ok: boolean; issues: string[] };
    title?: { ok: boolean; issues: string[] };
  };
  fillInstructions?: string;
  retryCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type PreparePublishResult = {
  taskId: string;
  ok: boolean;
  validation: PublishTask['validation'];
  fillPayload: PublishFillPayload;
  fillInstructions?: string;
};

export type ImageJob = {
  id: string;
  productId: string;
  operations: Array<'dedupe_watermark' | 'upscale' | 'model_tryon' | 'translate_overlay'>;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  resultUrls?: string[];
  error?: string;
  createdAt: string;
  updatedAt: string;
};

export type DashboardMetrics = {
  totalProducts: number;
  rawCount: number;
  processingCount: number;
  readyCount: number;
  publishedCount: number;
};

/**
 * 选品洞察 - 竞品数据
 */
export type CompetitorProduct = {
  id: string;
  title: string;
  thumbnail: string;
  gmv: number; // 周GMV (USD)
  ctr: number; // 点击率 %
  sameProductCount: number; // 同款商品数
  comments: number; // 评论数
  dailyOrders: number; // 日均订单
  price: number; // 价格 (CNY)
  source: 'tiktok' | 'shopee';
  trend: 'up' | 'stable' | 'down';
};

/**
 * 选品洞察 - 转化率数据
 */
export type ConversionData = {
  date: string;
  orders: number;
  views: number;
  conversionRate: number;
  newComments: number;
};

/**
 * 选品洞察 - 毛利分析
 */
export type ProfitMargin = {
  costPrice: number; // 成本价 (CNY)
  sellPrice: number; // 售价 (VND/THB)
  currency: 'VND' | 'THB';
  profit: number; // 利润 (CNY)
  margin: number; // 利润率 %
};

/**
 * 选品洞察 - GMV/CTR 筛选配置
 */
export type GmvCtrFilter = {
  minGmv: number; // 最低周GMV (USD)
  minCtr: number; // 最低点击率 %
  maxSameProduct: number; // 最大同款数
  platform: 'tiktok' | 'shopee' | 'all';
};

/**
 * 选品洞察状态 (扩展版)
 */
export type InsightState = {
  id?: string;
  status: 'idle' | 'analyzing' | 'done' | 'error';
  keywords: Array<{ keyword: string; score: number; trend?: 'up' | 'down' | 'stable' }>;
  topFeatures: string[];
  // 新增字段
  competitors?: CompetitorProduct[];
  gmvFilter?: GmvCtrFilter;
  conversionTrend?: ConversionData[];
  profitMargins?: ProfitMargin[];
  lastAnalysisTime?: string;
  analyzedCount?: number;
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
