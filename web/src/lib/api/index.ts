import { httpApi, getApiBaseUrl } from './httpClient';
import { localApi } from './localAdapter';

/** 开发模式走 Vite 代理；生产若配置 VITE_API_URL 则走 HTTP，否则本地存储 */
export function resolveApiMode(): 'http' | 'local' {
  if (import.meta.env.VITE_FORCE_LOCAL_API === 'true') return 'local';
  if (import.meta.env.DEV) return 'http';
  return getApiBaseUrl() ? 'http' : 'local';
}

export const api = resolveApiMode() === 'http' ? httpApi : localApi;

export type {
  Product,
  ProductSku,
  ProductImage,
  ProcessedOutput,
  TemplateItem,
  SkuConfig,
  RuleItem,
  PublishTask,
  PublishFillPayload,
  PublishSku,
  DashboardMetrics,
  ImageJob,
  TargetLocale,
} from './types';
export { getApiBaseUrl, getStoredToken, setStoredToken } from './httpClient';
export { installExtensionBridge } from './extensionBridge';
