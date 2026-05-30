/**
 * API 编译入口 — 与 shared/listing/* 保持同步
 * @see docs/LISTING_PUBLISH_IMPLEMENTATION.md
 */
export * from './listing/status.js';
export * from './listing/skuEncoder.js';
export type {
  SkuEncodeInput,
  ParsedSku,
  PatternSide,
  SkuEncodeResult,
} from './listing/skuEncoder.js';
export * from './listing/antiBan.js';
export type { MaterialKind, AntiBanIssue, AntiBanScanResult } from './listing/antiBan.js';
export * from './listing/tiktokDefaults.js';
export type { DetailImageSlot } from './listing/tiktokDefaults.js';
export * from './listing/marketPricing.js';
export type { TargetMarket, MarketPricingRule } from './listing/marketPricing.js';
export * from './listing/titleRules.js';
export * from './listing/imageRules.js';
export * from './listing/contracts.js';
export type {
  LinkCatcherEntry,
  AdsPowerGateResult,
  AiImagePipelineConfig,
  AiImageOperation,
  AiImageJobStatus,
  BillingHook,
} from './listing/contracts.js';
export * from './listing/productFilters.js';
export type { ProductFilterCriteria, FilterableProductMetrics } from './listing/productFilters.js';
export * from './listing/categoryTemplates.js';
export type {
  CategoryTemplateId,
  SkuConfig,
  CategoryTemplate,
  DummyHookConfig,
} from './listing/categoryTemplates.js';

/** SKU 五段编码函数（BRD §4.2） */
export { encodeSku, encodeDummyHookSku, parseSku, resolveColorCode, formatSequence } from './listing/skuEncoder.js';

/** 定价规则 */
export { calcListPrice, getDefaultStock, getDefaultWeightGrams } from './listing/marketPricing.js';

/** 违禁词检查 */
export { validateTitle } from './listing/titleRules.js';
export { validateMaterialConsistency } from './listing/antiBan.js';
