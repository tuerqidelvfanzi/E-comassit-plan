import type {
  CompetitorJob,
  InsightsDashboardV2,
  LinkCollectJob,
  OpenApiIntegration,
  PublishAdapter,
  PublishTaskV2,
  TeamMember,
  TemplateCatalogItem,
  V2Overview,
} from './types.js';

export function seedTemplateCatalog(): TemplateCatalogItem[] {
  return [
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
      id: 'tpl-kids-a',
      name: '童装 · 年龄段尺码',
      mode: 'A',
      category: '童装',
      locales: ['vi-VN', 'th-TH', 'fil-PH'],
      milestone: 'v2.0',
      description: '52–160 码表、A 类面料提示',
      skuPreview: 'BF-0002-P-PK-110',
    },
    {
      id: 'tpl-lamp-b',
      name: '吊灯 · 中规格',
      mode: 'B',
      category: '灯具',
      locales: ['vi-VN', 'th-TH'],
      milestone: 'v2.2',
      description: '功率×色温×控制方式笛卡尔积',
      skuPreview: 'LMP-24W-WARM-SW',
    },
    {
      id: 'tpl-cabinet-c',
      name: '橱柜 · 定制',
      mode: 'C',
      category: '家居',
      locales: ['vi-VN', 'id-ID'],
      milestone: 'v2.3',
      description: '宽深高材质定制、加价项',
      skuPreview: 'CAB-BASE-001',
    },
    {
      id: 'tpl-men-a',
      name: '男装 · 商务休闲',
      mode: 'A',
      category: '男装',
      locales: ['vi-VN'],
      milestone: 'v2.0',
      description: 'S–XXL、低饱和配色',
      skuPreview: 'MN-0001-P-GY-L',
    },
    {
      id: 'tpl-women-a',
      name: '女装 · 韩风',
      mode: 'A',
      category: '女装',
      locales: ['th-TH', 'fil-PH'],
      milestone: 'v2.0',
      description: 'XS–XL、emoji 标题策略',
      skuPreview: 'WM-0001-PR-PK-M',
    },
  ];
}

export function seedPublishAdapters(): PublishAdapter[] {
  return [
    {
      id: 'adp-shopee-vn',
      platform: 'Shopee',
      locale: 'vi-VN',
      mode: 'dom_fill',
      status: 'ready',
      milestone: 'v2.0',
      lastMockFillAt: new Date().toISOString(),
    },
    {
      id: 'adp-tiktok-th',
      platform: 'TikTok Shop',
      locale: 'th-TH',
      mode: 'dom_fill',
      status: 'ready',
      milestone: 'v2.1',
    },
    {
      id: 'adp-shopee-ph',
      platform: 'Shopee',
      locale: 'fil-PH',
      mode: 'dom_fill',
      status: 'ready',
      milestone: 'v2.1',
    },
    {
      id: 'adp-shopee-id',
      platform: 'Shopee',
      locale: 'id-ID',
      mode: 'open_api',
      status: 'beta',
      milestone: 'v2.3',
    },
  ];
}

export function seedPublishTasks(): PublishTaskV2[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'pub-v2-1',
      productId: 'p3',
      title: '婴儿连体衣新生儿哈衣爬服',
      platform: 'Shopee',
      locale: 'vi-VN',
      status: 'completed',
      adapterId: 'adp-shopee-vn',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pub-v2-2',
      productId: 'p2',
      title: '儿童纯棉短袖T恤男童打底衫',
      platform: 'TikTok Shop',
      locale: 'th-TH',
      status: 'filling',
      adapterId: 'adp-tiktok-th',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pub-v2-3',
      title: '女童牛仔背带裤夏款百搭',
      platform: 'Shopee',
      locale: 'fil-PH',
      status: 'pending',
      adapterId: 'adp-shopee-ph',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pub-v2-4',
      title: '定制橱柜组合柜 Mock',
      platform: 'Shopee',
      locale: 'id-ID',
      status: 'draft',
      adapterId: 'adp-shopee-id',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pub-v2-5',
      title: '测试填表失败样例',
      platform: 'Shopee',
      locale: 'vi-VN',
      status: 'failed',
      reason: 'Mock：选择器版本过期，已记录日志',
      adapterId: 'adp-shopee-vn',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function seedCompetitorJobs(): CompetitorJob[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'cmp-1',
      keyword: '儿童 T恤 纯棉',
      sourcePlatform: '淘宝',
      status: 'done',
      createdAt: now,
      updatedAt: now,
      report: mockReport('儿童 T恤 纯棉', '淘宝'),
    },
    {
      id: 'cmp-2',
      keyword: '吊灯 客厅 LED',
      sourcePlatform: '1688',
      status: 'idle',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function mockSimilarProducts(keyword: string, sourcePlatform: string) {
  const base = keyword.split(/\s+/)[0] || '爆款';
  return [
    {
      title: `${base} 卡通印花纯棉短袖`,
      priceCny: 22.8,
      salesHint: '月销 1.2万+',
      sourceUrl: `https://mock.${sourcePlatform}/item/sim-1`,
      thumb: 'https://placehold.co/64x64/3b82f6/white?text=1',
    },
    {
      title: `韩版${base} 透气圆领T`,
      priceCny: 19.9,
      salesHint: '月销 8600+',
      sourceUrl: `https://mock.${sourcePlatform}/item/sim-2`,
      thumb: 'https://placehold.co/64x64/8b5cf6/white?text=2',
    },
    {
      title: `A04蓝熊 ${base} 亲子款`,
      priceCny: 28.5,
      salesHint: '月销 5200+',
      sourceUrl: `https://mock.${sourcePlatform}/item/sim-3`,
      thumb: 'https://placehold.co/64x64/ec4899/white?text=3',
    },
  ];
}

export function mockReport(keyword: string, sourcePlatform = '淘宝') {
  return {
    keywords: [
      { word: '纯棉', count: 42, score: 96 },
      { word: '透气', count: 38, score: 91 },
      { word: '卡通', count: 29, score: 84 },
      { word: keyword.split(' ')[0] ?? '爆款', count: 22, score: 80 },
    ],
    priceRange: { min: 18, max: 65, currency: 'CNY' },
    popularColors: ['白色', '黑色', '粉色', '蓝色'],
    popularSizes: ['110', '120', '130', 'S', 'M', 'L'],
    sampleTitles: [
      'A04蓝熊卡通纯棉T恤',
      'เสื้อยืดเด็กน่ารัก ผ้าฝ้าย',
      'Áo thun bé gái cotton',
    ],
    gmvEstimate: '¥12万–18万 / 月（Mock）',
    ctrEstimate: '3.2%–4.8%（Mock）',
    similarProducts: mockSimilarProducts(keyword, sourcePlatform),
  };
}

export function seedLinkCollectJobs(): LinkCollectJob[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'lnk-1',
      url: 'https://item.taobao.com/item.htm?id=demo',
      sourcePlatform: '淘宝',
      status: 'done',
      progress: 100,
      productPreview: {
        title: '韩版童装连衣裙夏季女童公主裙',
        priceCny: 28.5,
        thumb: 'https://placehold.co/80x80/pink/white?text=SKU',
        skuCount: 8,
      },
      createdAt: now,
    },
  ];
}

export function seedTeam(): TeamMember[] {
  const now = new Date().toISOString();
  return [
    { id: 'tm-1', name: 'Admin', role: 'owner', email: 'admin01@demo.local', lastActiveAt: now },
    { id: 'tm-2', name: '运营 A', role: 'operator', email: 'ops-a@demo.local', lastActiveAt: now },
    { id: 'tm-3', name: '选品 B', role: 'viewer', email: 'picker-b@demo.local', lastActiveAt: now },
  ];
}

export function seedOpenApi(): OpenApiIntegration[] {
  return [
    {
      platform: 'Shopee Open Platform',
      locale: 'id-ID',
      status: 'mock',
      scopes: ['item.add', 'item.update'],
      quotaUsed: 120,
      quotaLimit: 1000,
    },
    {
      platform: 'TikTok Shop API',
      locale: 'th-TH',
      status: 'disconnected',
      scopes: ['product.upload'],
      quotaUsed: 0,
      quotaLimit: 500,
    },
  ];
}

export function buildOverview(metrics: {
  totalProducts: number;
}): V2Overview {
  return {
    milestone: 'v2.0–v2.3 演示（全 Mock）',
    mock: true,
    metrics: {
      totalProducts: metrics.totalProducts,
      competitorJobsDone: 1,
      linkCollectDone: 1,
      publishCompleted: 1,
      templatesActive: 4,
    },
    features: [
      { id: 'collect', label: '插件/链接/榜单采集', milestone: 'v2.0', ready: true },
      { id: 'pipeline', label: 'AI 处理管线（Mock）', milestone: 'v2.0', ready: true },
      { id: 'publish-dom', label: 'DOM 填表演示', milestone: 'v2.0', ready: true },
      { id: 'competitor', label: '竞品分析 Job', milestone: 'v2.1', ready: true },
      { id: 'insights', label: 'GMV/CTR 洞察', milestone: 'v2.1', ready: true },
      { id: 'rules', label: '规则库可配置', milestone: 'v2.1', ready: true },
      { id: 'lamp-b', label: 'B 类吊灯模板', milestone: 'v2.2', ready: true },
      { id: 'link-batch', label: '链接直采 & 批量榜单', milestone: 'v2.2', ready: true },
      { id: 'cabinet-c', label: 'C 类定制模板', milestone: 'v2.3', ready: true },
      { id: 'openapi', label: 'Open API 适配器', milestone: 'v2.3', ready: true },
      { id: 'team', label: '团队多用户（Mock）', milestone: 'v2.3', ready: true },
      { id: 'title-optimization', label: '天猫标题优化 7 步', milestone: 'v2.0', ready: true },
    ],
  };
}

export function buildInsightsDashboard(jobs: CompetitorJob[]): InsightsDashboardV2 {
  return {
    keywords: [
      { keyword: '纯棉', score: 96, trend: 'up' },
      { keyword: '透气', score: 92, trend: 'up' },
      { keyword: '女童', score: 85, trend: 'stable' },
      { keyword: '夏季', score: 81, trend: 'stable' },
      { keyword: 'LED', score: 78, trend: 'up' },
    ],
    gmvBands: [
      { band: '< ¥5万', count: 12 },
      { band: '¥5–15万', count: 28 },
      { band: '> ¥15万', count: 9 },
    ],
    ctrBands: [
      { band: '< 2%', count: 8 },
      { band: '2–4%', count: 31 },
      { band: '> 4%', count: 10 },
    ],
    competitorReports: jobs
      .filter((j) => j.status === 'done')
      .map((j) => ({ id: j.id, keyword: j.keyword, updatedAt: j.updatedAt })),
    topFeatures: [
      '主图：白底 + 正面模特（Mock 统计）',
      '标题：年龄段 + 材质 + 场景词',
      '价格带：CNY 18–65 竞争密集区',
    ],
  };
}
