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
  TitleComparison,
  TitleOptimizationJob,
  TitleSearchTermRow,
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
      similarProducts: [
        {
          title: '儿童 纯棉 卡通短袖',
          priceCny: 22.8,
          salesHint: '月销 1.2万+',
          sourceUrl: 'https://mock.taobao/item/sim-1',
          thumb: 'https://placehold.co/64x64/3b82f6/white?text=1',
        },
      ],
    },
  },
];

let localRuns: PipelineRunV2[] = [];
let linkJobs: LinkCollectJob[] = [];
let titleJobs: TitleOptimizationJob[] = [];
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
        { id: 'title-optimization', label: '天猫标题优化 7 步', milestone: 'v2.0', ready: true },
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
      similarProducts: [
        {
          title: `${job.keyword} 类似款 A`,
          priceCny: 21.5,
          salesHint: '月销 5000+',
          sourceUrl: `https://mock.${job.sourcePlatform}/sim-a`,
          thumb: 'https://placehold.co/64x64',
        },
        {
          title: `${job.keyword} 类似款 B`,
          priceCny: 24.0,
          salesHint: '月销 3200+',
          sourceUrl: `https://mock.${job.sourcePlatform}/sim-b`,
          thumb: 'https://placehold.co/64x64',
        },
      ],
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
        title: locale === 'vi-VN' ? 'A04蓝熊纯棉T恤' : 'Mock 高曝光',
        shortDescription: locale === 'vi-VN' ? '纯棉透气童T' : '短描述',
        priceLabel: '₫99,000',
      },
      conversion: {
        title: locale === 'vi-VN' ? '童T纯棉 蓝熊' : 'Mock 高转化',
        shortDescription: '可爱印花',
        priceLabel: '₫95,000',
      },
      skus: [
        {
          skuCode: 'BF-0001-PR-WH-S',
          color: 'WH',
          size: 'S',
          price: 400,
          stock: 50,
        },
        {
          skuCode: 'BF-0002-PR-BK-M',
          color: 'BK',
          size: 'M',
          price: 400,
          stock: 50,
        },
      ],
      shopeeVnChecklist:
        locale === 'vi-VN'
          ? [
              { id: 'title', label: '4. 标题 ≤20 字', done: false },
              { id: 'sku_price_stock', label: '6. SKU', done: true },
            ]
          : undefined,
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
  async listTitleOptimizationJobs() {
    await delay();
    return titleJobs;
  },
  async createTitleOptimizationJob(categoryName: string, tmallProductId: string) {
    await delay();
    const now = new Date().toISOString();
    const job: TitleOptimizationJob = {
      id: `tto-${Date.now()}`,
      categoryName,
      tmallProductId,
      status: 'created',
      currentStep: 1,
      workerNote: '本地 Mock：正式环境由 Worker 连接生意参谋与天猫卖家中心。',
      createdAt: now,
      updatedAt: now,
    };
    titleJobs = [job, ...titleJobs];
    return job;
  },
  async collectTitleSearchTerms(id: string) {
    await delay(600);
    const job = titleJobs.find((j) => j.id === id);
    if (!job) throw new Error('NOT_FOUND');
    job.searchTerms = localMockSearchTerms(job.categoryName);
    job.status = 'search_terms_ready';
    job.currentStep = 2;
    job.updatedAt = new Date().toISOString();
    return job;
  },
  async generateTitleOptimization(id: string) {
    await delay(800);
    const job = titleJobs.find((j) => j.id === id);
    if (!job) throw new Error('NOT_FOUND');
    if (!job.searchTerms?.length) job.searchTerms = localMockSearchTerms(job.categoryName);
    job.generatedTitle = `${job.categoryName}${job.searchTerms[0]?.keyword ?? ''}家用节能`;
    job.status = 'title_generated';
    job.currentStep = 3;
    job.updatedAt = new Date().toISOString();
    return job;
  },
  async fetchTitleOriginal(id: string) {
    await delay(500);
    const job = titleJobs.find((j) => j.id === id);
    if (!job) throw new Error('NOT_FOUND');
    job.originalTitle = `【厂家直销】${job.categoryName}包邮`;
    job.originalScore = '人气分 3.2万';
    job.status = 'original_fetched';
    job.currentStep = 4;
    job.updatedAt = new Date().toISOString();
    return job;
  },
  async compareTitleOptimization(id: string) {
    await delay(500);
    const job = titleJobs.find((j) => j.id === id);
    if (!job) throw new Error('NOT_FOUND');
    const comparison: TitleComparison = {
      originalTitle: job.originalTitle ?? '原标题',
      originalScore: '人气分 3.2万',
      suggestedTitle: job.generatedTitle ?? '建议标题',
      suggestedScore: '人气分 5.8万（预估）',
      wordsToRemove: ['包邮', '厂家直销'],
      wordsToAdd: ['静音', '节能'],
      otherSuggestions: ['核心词前置', '删除促销承诺词'],
    };
    job.comparison = comparison;
    job.status = 'awaiting_confirm';
    job.currentStep = 5;
    job.updatedAt = new Date().toISOString();
    return job;
  },
  async applyTitleOptimization(id: string, confirmed: boolean) {
    await delay(700);
    const job = titleJobs.find((j) => j.id === id);
    if (!job) throw new Error('NOT_FOUND');
    if (!confirmed) {
      job.status = 'cancelled';
      job.updatedAt = new Date().toISOString();
      return job;
    }
    job.status = 'completed';
    job.currentStep = 7;
    job.appliedAt = new Date().toISOString();
    job.verificationNote = '本地 Mock：已模拟天猫后台标题更换成功。';
    job.updatedAt = new Date().toISOString();
    return job;
  },
};

function localMockSearchTerms(categoryName: string): TitleSearchTermRow[] {
  return [
    { keyword: `${categoryName} 静音`, metrics: '搜索人气 12.8万 · 7天' },
    { keyword: `${categoryName} 家用`, metrics: '搜索人气 9.2万 · 7天' },
  ];
}

function keywordSlice(k: string) {
  return k.slice(0, 4) || '热词';
}
