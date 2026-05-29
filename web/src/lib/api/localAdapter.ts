import type {
  AuthSession,
  DashboardMetrics,
  InsightState,
  Product,
  PublishTask,
  RuleItem,
  TemplateItem,
} from './types';
import {
  deleteProduct,
  getCollectJobs,
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
    const task: PublishTask = {
      id: uid('pub'),
      platform: input.platform,
      title: input.title,
      status: 'pending',
      productId: input.productId,
    };
    savePublishTasks([task, ...getPublishTasks()]);
    return task;
  },

  async updatePublishTask(id: string, patch: Partial<PublishTask>) {
    await delay(100);
    const next = getPublishTasks().map((t) =>
      t.id === id
        ? {
            ...t,
            ...patch,
            status:
              patch.status === 'completed'
                ? ('completed' as const)
                : (patch.status ?? t.status),
          }
        : t,
    );
    savePublishTasks(next);
    return { updated: true };
  },

  async getExtensionToken() {
    await delay(30);
    return { token: getExtensionToken() };
  },

  async rotateExtensionToken() {
    await delay(30);
    return { token: rotateExtensionToken() };
  },
};
