import type {
  ApiEnvelope,
  AuthSession,
  BatchCollectJob,
  CookieJarInfo,
  DashboardMetrics,
  ImageJob,
  InsightState,
  PreparePublishResult,
  Product,
  PublishTask,
  RuleItem,
  SkuConfig,
  TemplateItem,
} from './types';

const TOKEN_KEY = 'psa_access_token';

export function getApiBaseUrl() {
  const env = import.meta.env.VITE_API_URL as string | undefined;
  if (env) return env.replace(/\/+$/, '');
  if (import.meta.env.DEV) return '';
  return '';
}

export function getStoredToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  init?: RequestInit & { extensionToken?: string },
): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}/api/v1${path}`;
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  const token = getStoredToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init?.extensionToken) headers.set('X-Extension-Token', init.extensionToken);

  const res = await fetch(url, { ...init, headers });
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || json.code !== 0) {
    throw new Error(json.message || `HTTP ${res.status}`);
  }
  return json.data;
}

export const httpApi = {
  login(username: string, password: string) {
    return request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  me() {
    return request<{ id: string; username: string }>('/auth/me');
  },

  getMetrics() {
    return request<DashboardMetrics>('/dashboard/metrics');
  },

  getProducts(status?: string) {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<Product[]>(`/products${q}`);
  },

  getProduct(id: string) {
    return request<Product>(`/products/${id}`);
  },

  updateProduct(id: string, patch: Partial<Product>) {
    return request<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  deleteProduct(id: string) {
    return request<{ deleted: boolean }>(`/products/${id}`, { method: 'DELETE' });
  },

  runPipeline(productId: string, body: { templateId?: string; adhocPrompt?: string }) {
    return request<{ product: Product; processed: Product['processed'] }>(
      `/products/${productId}/pipeline-runs`,
      { method: 'POST', body: JSON.stringify(body) },
    );
  },

  submitCollect(payload: unknown, extensionToken: string) {
    return request<{ product: Product }>('/collect-jobs', {
      method: 'POST',
      body: JSON.stringify({ payload }),
      extensionToken,
    });
  },

  getTemplates() {
    return request<TemplateItem[]>('/category-templates');
  },

  saveTemplate(item: TemplateItem) {
    return request<TemplateItem>('/category-templates', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  deleteTemplate(id: string) {
    return request<{ deleted: boolean }>(`/category-templates/${id}`, { method: 'DELETE' });
  },

  getRules() {
    return request<RuleItem[]>('/rule-sets');
  },

  saveRule(item: RuleItem) {
    return request<RuleItem>('/rule-sets', { method: 'POST', body: JSON.stringify(item) });
  },

  deleteRule(id: string) {
    return request<{ deleted: boolean }>(`/rule-sets/${id}`, { method: 'DELETE' });
  },

  getInsight() {
    return request<InsightState>('/insights/latest');
  },

  runInsight() {
    return request<InsightState>('/insights/run', { method: 'POST' });
  },

  getPublishTasks() {
    return request<PublishTask[]>('/publish-tasks');
  },

  createPublishTask(input: { platform: PublishTask['platform']; title: string; productId?: string }) {
    return request<PublishTask>('/publish-tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updatePublishTask(id: string, patch: Partial<PublishTask>) {
    return request<{ updated: boolean }>(`/publish-tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  preparePublishTask(id: string) {
    return request<PreparePublishResult>(`/publish-tasks/${id}/prepare`, { method: 'POST' });
  },

  createImageJob(productId: string, operations: ImageJob['operations']) {
    return request<ImageJob>(`/products/${productId}/image-jobs`, {
      method: 'POST',
      body: JSON.stringify({ operations }),
    });
  },

  listImageJobs(productId: string) {
    return request<ImageJob[]>(`/products/${productId}/image-jobs`);
  },

  getExtensionToken() {
    return request<{ token: string | null }>('/extension/token');
  },

  rotateExtensionToken() {
    return request<{ token: string }>('/extension/token', { method: 'POST' });
  },

  createBatchCollect(input: {
    listUrl: string;
    maxItems?: number;
    delayMsMin?: number;
    delayMsMax?: number;
    useCookies?: boolean;
    requireUserConfirm: true;
    startImmediately?: boolean;
  }) {
    return request<BatchCollectJob>('/collect-jobs/batch', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  listBatchCollect() {
    return request<BatchCollectJob[]>('/collect-jobs/batch');
  },

  getBatchCollect(id: string) {
    return request<BatchCollectJob>(`/collect-jobs/batch/${id}`);
  },

  runBatchCollect(id: string) {
    return request<{ scheduled: boolean; id: string }>(`/collect-jobs/batch/${id}/run`, {
      method: 'POST',
    });
  },

  getCookieJars() {
    return request<CookieJarInfo[]>('/extension/cookies');
  },

  // SKU Encoding (BRD §4.2)
  encodeSku(input: { prefix?: string; sequence: number; side: 'P' | 'R' | 'PR'; color: string; size: string }) {
    return request<{ skuCode: string }>('/sku/encode', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  encodeSkuBatch(input: {
    prefix?: string;
    sequenceStart?: number;
    colors: string[];
    sizes: string[];
    sides?: Array<'P' | 'R' | 'PR'>;
  }) {
    return request<{ skus: Array<{ skuCode: string; color: string; size: string; side: string }>; total: number }>(
      '/sku/encode-batch',
      { method: 'POST', body: JSON.stringify(input) },
    );
  },

  getDummyHookSku(input?: { prefix?: string; size?: string }) {
    return request<{
      skuCode: string;
      color: string;
      size: string;
      price: number;
      stock: number;
      weight: number;
      isDummyHook: boolean;
    }>('/sku/dummy-hook', {
      method: 'POST',
      body: JSON.stringify(input ?? {}),
    });
  },
};
