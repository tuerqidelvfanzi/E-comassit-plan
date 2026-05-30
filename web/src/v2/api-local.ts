/** 静态/GitHub Pages 演示：浏览器内 Mock，与 api/src/v2 行为一致 */
import type {
  CompetitorJob,
  InsightsDashboardV2,
  LinkCollectJob,
  OpenApiIntegration,
  PipelineRunV2,
  PublishAdapter,
  PublishTaskV2,
  TargetLocale,
  TeamMember,
  TemplateCatalogItem,
  V2Overview,
} from './types';

const catalog: TemplateCatalogItem[] = [
  {
    id: 'tpl-tshirt-a',
    name: 'T恤 · 多规格服装',
    mode: 'A',
    category: '服装',
    locales: ['vi-VN', 'th-TH'],
    milestone: 'v2.0',
    description: '颜色×尺码矩阵、五段 SKU、白色钩子',
    skuPreview: 'BF-0001-PR-WH-S',
  },
  {
    id: 'tpl-lamp-b',
    name: '吊灯 · 中规格',
    mode: 'B',
    category: '灯具',
    locales: ['vi-VN', 'th-TH'],
    milestone: 'v2.2',
    description: '功率×色温×控制',
    skuPreview: 'LMP-24W-WARM-SW',
  },
  {
    id: 'tpl-cabinet-c',
    name: '橱柜 · 定制',
    mode: 'C',
    category: '家居',
    locales: ['vi-VN', 'id-ID'],
    milestone: 'v2.3',
    description: '定制宽深高',
    skuPreview: 'CAB-BASE-001',
  },
];

let competitors: CompetitorJob[] = [
  {
    id: 'cmp-local-1',
    keyword: '儿童 T恤 纯棉',
    sourcePlatform: '淘宝',
    status: 'done',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    report: {
      keywords: [{ word: '纯棉', count: 42, score: 96 }],
      priceRange: { min: 18, max: 65, currency: 'CNY' },
      popularColors: ['白色', '黑色'],
      popularSizes: ['110', '120'],
      sampleTitles: ['A04蓝熊卡通纯棉T恤'],
      gmvEstimate: 'Mock GMV',
      ctrEstimate: 'Mock CTR',
    },
  },
];

let localRuns: PipelineRunV2[] = [];
let linkJobs: LinkCollectJob[] = [];
let publishTasks: PublishTaskV2[] = [
  {
    id: 'pub-l1',
    title: '演示商品 · 越南站',
    platform: 'Shopee',
    locale: 'vi-VN',
    status: 'pending',
    adapterId: 'adp-shopee-vn',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export const v2ApiLocal = {
  async getOverview(): Promise<V2Overview> {
    await delay();
    return {
      milestone: 'v2.0–v2.3（本地 Mock）',
      mock: true,
      metrics: {
        totalProducts: 8,
        competitorJobsDone: 1,
        linkCollectDone: linkJobs.length,
        publishCompleted: 0,
        templatesActive: 3,
      },
      features: [
        { id: 'pipeline', label: 'AI 管线 Mock', milestone: 'v2.0', ready: true },
        { id: 'competitor', label: '竞品分析', milestone: 'v2.1', ready: true },
        { id: 'openapi', label: 'Open API', milestone: 'v2.3', ready: true },
      ],
    };
  },
  async getTemplateCatalog() {
    await delay();
    return catalog;
  },
  async getPublishAdapters(): Promise<PublishAdapter[]> {
    await delay();
    return [
      {
        id: 'adp-shopee-vn',
        platform: 'Shopee',
        locale: 'vi-VN',
        mode: 'dom_fill',
        status: 'ready',
        milestone: 'v2.0',
      },
    ];
  },
  async getTeamMembers(): Promise<TeamMember[]> {
    await delay();
    return [{ id: '1', name: 'Admin', role: 'owner', email: 'local@demo', lastActiveAt: '' }];
  },
  async getOpenApiIntegrations(): Promise<OpenApiIntegration[]> {
    await delay();
    return [
      {
        platform: 'Shopee Open',
        locale: 'id-ID',
        status: 'mock',
        scopes: ['item.add'],
        quotaUsed: 10,
        quotaLimit: 100,
      },
    ];
  },
  async getInsightsDashboard(): Promise<InsightsDashboardV2> {
    await delay();
    return {
      keywords: [{ keyword: '纯棉', score: 96, trend: 'up' }],
      gmvBands: [{ band: '¥5–15万', count: 20 }],
      ctrBands: [{ band: '2–4%', count: 25 }],
      competitorReports: competitors.map((c) => ({
        id: c.id,
        keyword: c.keyword,
        updatedAt: c.updatedAt,
      })),
      topFeatures: ['本地 Mock 洞察'],
    };
  },
  async listCompetitorJobs() {
    await delay();
    return competitors;
  },
  async createCompetitorJob(keyword: string, sourcePlatform: string) {
    await delay();
    const job: CompetitorJob = {
      id: `cmp-${Date.now()}`,
      keyword,
      sourcePlatform,
      status: 'idle',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    competitors = [job, ...competitors];
    return job;
  },
  async runCompetitorJob(id: string) {
    await delay(800);
    const job = competitors.find((j) => j.id === id);
    if (!job) throw new Error('NOT_FOUND');
    job.status = 'done';
    job.report = {
      keywords: [{ word: keywordSlice(job.keyword), count: 10, score: 88 }],
      priceRange: { min: 20, max: 50, currency: 'CNY' },
      popularColors: ['白', '黑'],
      popularSizes: ['M', 'L'],
      sampleTitles: [`${job.keyword} 爆款样例`],
      gmvEstimate: 'Mock',
      ctrEstimate: 'Mock',
    };
    job.updatedAt = new Date().toISOString();
    return job;
  },
  async listLinkCollect() {
    await delay();
    return linkJobs;
  },
  async createLinkCollect(url: string) {
    await delay(600);
    const job: LinkCollectJob = {
      id: `lnk-${Date.now()}`,
      url,
      sourcePlatform: '链接',
      status: 'done',
      progress: 100,
      productPreview: {
        title: '直采 Mock 商品',
        priceCny: 29.9,
        thumb: 'https://placehold.co/80x80',
        skuCount: 6,
      },
      createdAt: new Date().toISOString(),
    };
    linkJobs = [job, ...linkJobs];
    return job;
  },
  async listPublishTasks() {
    await delay();
    return publishTasks;
  },
  async simulatePublishFill(id: string) {
    await delay(1000);
    const task = publishTasks.find((t) => t.id === id);
    if (!task) throw new Error('NOT_FOUND');
    task.status = 'completed';
    task.updatedAt = new Date().toISOString();
    return { task, log: 'Local mock fill OK' };
  },
  async runPipeline(
    productId: string,
    templateId: string,
    locale: TargetLocale,
    adhocPrompt?: string,
  ) {
    await delay(1200);
    const run: PipelineRunV2 = {
      id: `run-${Date.now()}`,
      productId,
      templateId,
      locale,
      mock: true,
      exposure: {
        title: 'Mock 高曝光标题',
        shortDescription: '短描述',
        priceLabel: '₫99,000',
      },
      conversion: {
        title: 'Mock 高转化标题',
        shortDescription: '短描述2',
        priceLabel: '₫95,000',
      },
      skus: [{ skuCode: 'BF-0001-PR-WH-S', color: 'WH', size: 'S', price: 400, stock: 50 }],
      warnings: adhocPrompt ? ['已应用临时 Prompt'] : [],
      ranAt: new Date().toISOString(),
    };
    localRuns = [run, ...localRuns];
    return { run, mock: true };
  },
  async listPipelineRuns(productId: string) {
    await delay();
    return localRuns.filter((r) => r.productId === productId);
  },
};

function keywordSlice(k: string) {
  return k.slice(0, 4) || '热词';
}
