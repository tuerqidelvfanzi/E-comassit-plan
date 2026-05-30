import type {
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
  TemplateItem,
} from './types';
import {
  deleteProduct,
  getCollectJobs,
  getBatchJobs,
  getCookieJars,
  getExtensionToken,
  getInsight,
  getMetrics,
  getProduct,
  getProducts,
  getPublishTasks,
  getRules,
  getTemplates,
  ingestNormalized,
  rotateExtensionToken,
  saveBatchJobs,
  saveCookieJars,
  saveInsight,
  savePublishTasks,
  saveRules,
  saveTemplates,
  updateProduct,
} from '../prototypeDb';
import { runPipeline } from '../pipelineEngine';
import type { TemplateItem as MockTemplate } from '../mock';

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

function uid(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

export const localApi = {
  async login(username: string, password: string): Promise<AuthSession> {
    await delay();
    if (username !== 'admin01' || password !== 'abcd234') throw new Error('INVALID_CREDENTIALS');
    return {
      accessToken: 'local-demo-token',
      refreshToken: 'local-demo-refresh',
      user: { id: 'user-admin01', username: 'admin01' },
    };
  },

  async me() {
    await delay(50);
    return { id: 'user-admin01', username: 'admin01' };
  },

  async getMetrics(): Promise<DashboardMetrics> {
    await delay(50);
    return getMetrics();
  },

  async getProducts(status?: string): Promise<Product[]> {
    await delay(80);
    const all = getProducts() as Product[];
    return status ? all.filter((p) => p.status === status) : all;
  },

  async getProduct(id: string) {
    await delay(80);
    const p = getProduct(id);
    if (!p) throw new Error('NOT_FOUND');
    return p as Product;
  },

  async updateProduct(id: string, patch: Partial<Product>) {
    await delay(80);
    updateProduct(id, patch as Parameters<typeof updateProduct>[1]);
    return getProduct(id) as Product;
  },

  async deleteProduct(id: string) {
    await delay(80);
    deleteProduct(id);
    return { deleted: true };
  },

  async runPipeline(productId: string, body: { templateId?: string; adhocPrompt?: string }) {
    await delay(600);
    const p = getProduct(productId);
    if (!p) throw new Error('NOT_FOUND');
    updateProduct(productId, { status: 'processing' });
    const processed = await runPipeline(
      {
        title: p.title,
        priceCny: p.priceCny,
        targetLocale: p.targetLocale,
        promptNote: body.adhocPrompt,
      },
      undefined,
    );
    updateProduct(productId, { status: 'ready', processed, pipelineNote: body.adhocPrompt });
    return { product: getProduct(productId) as Product, processed };
  },

  async submitCollect(payload: unknown, _extensionToken: string) {
    await delay(300);
    const product = ingestNormalized(payload);
    if (!product) throw new Error('INVALID_COLLECT_PAYLOAD');
    void getCollectJobs();
    return { product: product as Product };
  },

  async getTemplates(): Promise<TemplateItem[]> {
    await delay(50);
    return getTemplates().map((t) => ({ ...t, promptBody: '' }));
  },

  async saveTemplate(item: TemplateItem) {
    await delay(100);
    const list = getTemplates();
    const idx = list.findIndex((t) => t.id === item.id);
    const mock: MockTemplate = {
      id: item.id,
      name: item.name,
      status: item.status,
      note: item.note,
      language: item.language,
    };
    const next = idx >= 0 ? list.map((t) => (t.id === item.id ? mock : t)) : [mock, ...list];
    saveTemplates(next);
    return item;
  },

  async deleteTemplate(id: string) {
    await delay(100);
    saveTemplates(getTemplates().filter((t) => t.id !== id));
    return { deleted: true };
  },

  async getRules(): Promise<RuleItem[]> {
    await delay(50);
    return getRules().map((r, i) => ({ ...r, id: `r${i}` }));
  },

  async saveRule(item: RuleItem) {
    await delay(100);
    const list = getRules();
    const next = list.some((r) => r.name === item.name)
      ? list.map((r) => (r.name === item.name ? item : r))
      : [item, ...list];
    saveRules(next);
    return item;
  },

  async deleteRule(id: string) {
    await delay(100);
    const rules = getRules();
    const target = rules.find((_, i) => `r${i}` === id || (rules as RuleItem[]).find((x) => x.id === id));
    saveRules(rules.filter((r) => r.name !== target?.name && (r as RuleItem).id !== id));
    return { deleted: true };
  },

  async getInsight(): Promise<InsightState> {
    await delay(50);
    const i = getInsight();
    return {
      status: i.status,
      keywords: i.keywords,
      topFeatures: i.topFeatures,
      updatedAt: i.updatedAt,
    };
  },

  async runInsight(): Promise<InsightState> {
    await delay(800);
    const keywords = [
      { keyword: '纯棉', score: 92 },
      { keyword: '透气', score: 88 },
    ];
    const job = {
      id: 'insight-1',
      status: 'done' as const,
      keywords,
      topFeatures: ['主图：白底 + 模特正面'],
      updatedAt: new Date().toISOString(),
    };
    saveInsight(job);
    return {
      status: job.status,
      keywords: job.keywords,
      topFeatures: job.topFeatures,
      updatedAt: job.updatedAt,
    };
  },

  async getPublishTasks(): Promise<PublishTask[]> {
    await delay(50);
    return getPublishTasks().map((t) => ({
      ...t,
      status: t.status === 'completed' ? 'completed' : t.status,
    })) as PublishTask[];
  },

  async createPublishTask(input: {
    platform: PublishTask['platform'];
    title: string;
    productId?: string;
  }) {
    await delay(100);
    const task = {
      id: uid('pub'),
      platform: input.platform,
      title: input.title,
      status: 'pending' as const,
      productId: input.productId,
    };
    savePublishTasks([task, ...getPublishTasks()]);
    return task as PublishTask;
  },

  async updatePublishTask(id: string, patch: Partial<PublishTask>) {
    await delay(100);
    const next = getPublishTasks().map((t) => {
      if (t.id !== id) return t;
      const status =
        patch.status === 'completed' || patch.status === 'failed' || patch.status === 'pending'
          ? patch.status
          : t.status;
      return { ...t, ...patch, status };
    });
    savePublishTasks(next);
    return { updated: true };
  },

  async preparePublishTask(id: string): Promise<PreparePublishResult> {
    await delay(200);
    const task = getPublishTasks().find((t) => t.id === id);
    if (!task) throw new Error('NOT_FOUND');
    const product = task.productId ? (getProduct(task.productId) as Product | undefined) : undefined;
    const title = product?.processed?.conversion?.title ?? product?.title ?? task.title;
    const priceCny = product?.priceCny ?? 0;
    const listPrice =
      task.platform === 'TikTok Shop'
        ? Math.round(priceCny * 5.2 * 1.8)
        : Math.round(priceCny * 3500 * 2.5);
    const fillPayload = {
      platform: (task.platform === 'TikTok Shop'
        ? 'tiktok'
        : task.platform === '淘宝'
          ? 'taobao'
          : 'shopee') as 'tiktok' | 'taobao' | 'shopee',
      title,
      price: listPrice,
      currency: task.platform === 'TikTok Shop' ? 'THB' : 'VND',
      stock: task.platform === 'TikTok Shop' ? 5 : 50,
      weightGrams: 220,
      brand: 'No Brand',
    };
    return {
      taskId: id,
      ok: true,
      validation: { ok: true, issues: [] },
      fillPayload,
      fillInstructions: `标题「${title}」· 价格 ${listPrice}`,
    };
  },

  async createImageJob(productId: string, operations: ImageJob['operations']): Promise<ImageJob> {
    await delay(400);
    const p = getProduct(productId);
    if (!p) throw new Error('NOT_FOUND');
    const suffix = operations.join('-');
    const urls = [
      `https://placehold.co/800x800/e2e8f0/64748b?text=${encodeURIComponent(`${productId}-${suffix}-1`)}`,
    ];
    updateProduct(productId, { images: [...(p.images ?? []), ...urls] });
    const now = new Date().toISOString();
    return {
      id: uid('imgjob'),
      productId,
      operations,
      status: 'completed',
      progress: 100,
      resultUrls: urls,
      createdAt: now,
      updatedAt: now,
    };
  },

  async listImageJobs(productId: string): Promise<ImageJob[]> {
    await delay(50);
    void productId;
    return [];
  },

  async getExtensionToken() {
    await delay(30);
    return { token: getExtensionToken() };
  },

  async rotateExtensionToken() {
    await delay(30);
    return { token: rotateExtensionToken() };
  },

  async createBatchCollect(input: {
    listUrl: string;
    maxItems?: number;
    delayMsMin?: number;
    delayMsMax?: number;
    useCookies?: boolean;
    requireUserConfirm: true;
  }): Promise<BatchCollectJob> {
    await delay(200);
    const job: BatchCollectJob = {
      id: uid('batch'),
      status: 'queued',
      listUrl: input.listUrl,
      maxItems: Math.min(input.maxItems ?? 10, 10),
      delayMsMin: input.delayMsMin ?? 250,
      delayMsMax: input.delayMsMax ?? 2400,
      useCookies: Boolean(input.useCookies),
      itemsDone: 0,
      itemsFailed: 0,
      results: [],
      auditLog: [{ event: 'queued', at: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    };
    saveBatchJobs([job, ...getBatchJobs()]);
    setTimeout(() => {
      const jobs = getBatchJobs();
      const j = jobs.find((x) => x.id === job.id);
      if (!j) return;
      const done = {
        ...j,
        status: 'done' as const,
        itemsDone: 3,
        itemsFailed: 0,
        results: [
          { url: `${input.listUrl}#1`, ok: true, productId: 'sim-1' },
          { url: `${input.listUrl}#2`, ok: true, productId: 'sim-2' },
          { url: `${input.listUrl}#3`, ok: true, productId: 'sim-3' },
        ],
        finishedAt: new Date().toISOString(),
      };
      saveBatchJobs(jobs.map((x) => (x.id === job.id ? done : x)));
      window.dispatchEvent(new Event('psa-db-change'));
    }, 2500);
    return job;
  },

  async listBatchCollect(): Promise<BatchCollectJob[]> {
    await delay(80);
    return getBatchJobs() as BatchCollectJob[];
  },

  async getBatchCollect(id: string): Promise<BatchCollectJob> {
    await delay(50);
    const j = getBatchJobs().find((x) => x.id === id);
    if (!j) throw new Error('NOT_FOUND');
    return j as BatchCollectJob;
  },

  async runBatchCollect(id: string) {
    await delay(100);
    return { scheduled: true, id };
  },

  async getCookieJars(): Promise<CookieJarInfo[]> {
    await delay(50);
    return getCookieJars();
  },
};
