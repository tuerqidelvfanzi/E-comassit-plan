export type TargetLocale = 'vi-VN' | 'th-TH' | 'fil-PH' | 'id-ID';

export interface V2Overview {
  milestone: string;
  mock: boolean;
  metrics: {
    totalProducts: number;
    competitorJobsDone: number;
    linkCollectDone: number;
    publishCompleted: number;
    templatesActive: number;
  };
  features: Array<{ id: string; label: string; milestone: string; ready: boolean }>;
}

export interface CompetitorJob {
  id: string;
  keyword: string;
  sourcePlatform: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  report?: {
    keywords: Array<{ word: string; count: number; score: number }>;
    priceRange: { min: number; max: number; currency: string };
    popularColors: string[];
    popularSizes: string[];
    sampleTitles: string[];
    gmvEstimate: string;
    ctrEstimate: string;
    similarProducts?: Array<{
      title: string;
      priceCny: number;
      salesHint: string;
      sourceUrl: string;
      thumb: string;
    }>;
  };
}

export interface LinkCollectJob {
  id: string;
  url: string;
  sourcePlatform: string;
  status: string;
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
  mode: 'A' | 'B' | 'C';
  category: string;
  locales: string[];
  milestone: string;
  description: string;
  skuPreview: string;
}

export interface PublishAdapter {
  id: string;
  platform: string;
  locale: string;
  mode: string;
  status: string;
  milestone: string;
  lastMockFillAt?: string;
}

export interface PublishTaskV2 {
  id: string;
  productId?: string;
  title: string;
  platform: string;
  locale: string;
  status: string;
  reason?: string;
  adapterId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  lastActiveAt: string;
}

export interface OpenApiIntegration {
  platform: string;
  locale: string;
  status: string;
  scopes: string[];
  quotaUsed: number;
  quotaLimit: number;
}

export interface InsightsDashboardV2 {
  keywords: Array<{ keyword: string; score: number; trend: string }>;
  gmvBands: Array<{ band: string; count: number }>;
  ctrBands: Array<{ band: string; count: number }>;
  competitorReports: Array<{ id: string; keyword: string; updatedAt: string }>;
  topFeatures: string[];
}

export interface PipelineRunV2 {
  id: string;
  productId: string;
  templateId: string;
  locale: string;
  mock: boolean;
  exposure: { title: string; shortDescription: string; priceLabel: string };
  conversion: { title: string; shortDescription: string; priceLabel: string };
  skus: Array<{
    skuCode: string;
    color: string;
    size: string;
    printVariant?: 'B' | 'H';
    price: number;
    stock: number;
  }>;
  shopeeVnChecklist?: Array<{ id: string; label: string; done: boolean }>;
  warnings: string[];
  ranAt: string;
}

export type TitleOptimizationStatus =
  | 'created'
  | 'search_terms_ready'
  | 'title_generated'
  | 'original_fetched'
  | 'awaiting_confirm'
  | 'applying'
  | 'completed'
  | 'cancelled'
  | 'failed';

export interface TitleSearchTermRow {
  keyword: string;
  metrics: string;
}

export interface TitleComparison {
  originalTitle: string;
  originalScore: string;
  suggestedTitle: string;
  suggestedScore: string;
  wordsToRemove: string[];
  wordsToAdd: string[];
  otherSuggestions: string[];
}

export interface TitleOptimizationJob {
  id: string;
  categoryName: string;
  tmallProductId: string;
  status: TitleOptimizationStatus;
  currentStep: number;
  workerNote?: string;
  searchTerms?: TitleSearchTermRow[];
  generatedTitle?: string;
  originalTitle?: string;
  originalScore?: string;
  suggestedTitle?: string;
  comparison?: TitleComparison;
  appliedAt?: string;
  verificationNote?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}
