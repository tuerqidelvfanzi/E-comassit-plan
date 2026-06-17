/**
 * 采集箱 / 选品筛选钩子（GMV、CTR 阈值 — InboxPage 批量操作前置）
 * BRD §2 选品阶段扩展；具体数据源 P1 接入洞察 API
 */

export type ProductFilterCriteria = {
  minGmv?: number;
  maxGmv?: number;
  minCtr?: number;
  maxCtr?: number;
  sources?: string[];
  minImageCount?: number;
  minSkuCount?: number;
};

export type FilterableProductMetrics = {
  id: string;
  gmv?: number;
  ctr?: number;
  source?: string;
  imageCount?: number;
  skuCount?: number;
};

export type ProductFilterResult = {
  passed: boolean;
  failedRules: string[];
};

export function applyProductFilters(
  product: FilterableProductMetrics,
  criteria: ProductFilterCriteria,
): ProductFilterResult {
  const failedRules: string[] = [];

  if (criteria.minGmv != null && (product.gmv ?? 0) < criteria.minGmv) {
    failedRules.push(`gmv < ${criteria.minGmv}`);
  }
  if (criteria.maxGmv != null && (product.gmv ?? Infinity) > criteria.maxGmv) {
    failedRules.push(`gmv > ${criteria.maxGmv}`);
  }
  if (criteria.minCtr != null && (product.ctr ?? 0) < criteria.minCtr) {
    failedRules.push(`ctr < ${criteria.minCtr}`);
  }
  if (criteria.maxCtr != null && (product.ctr ?? Infinity) > criteria.maxCtr) {
    failedRules.push(`ctr > ${criteria.maxCtr}`);
  }
  if (criteria.sources?.length && product.source && !criteria.sources.includes(product.source)) {
    failedRules.push(`source not in [${criteria.sources.join(',')}]`);
  }
  if (criteria.minImageCount != null && (product.imageCount ?? 0) < criteria.minImageCount) {
    failedRules.push(`imageCount < ${criteria.minImageCount}`);
  }
  if (criteria.minSkuCount != null && (product.skuCount ?? 0) < criteria.minSkuCount) {
    failedRules.push(`skuCount < ${criteria.minSkuCount}`);
  }

  return { passed: failedRules.length === 0, failedRules };
}
