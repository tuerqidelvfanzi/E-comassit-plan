export type ProductStatus = 'raw' | 'processing' | 'ready' | 'published';

export interface Product {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  priceCny: number;
  status: ProductStatus;
  category: string;
  thumb: string;
  targetLocale: 'vi-VN' | 'th-TH';
}

export interface TemplateItem {
  id: string;
  name: string;
  status: 'active' | 'draft';
  note: string;
  language: string;
}

export interface RuleItem {
  name: string;
  expr: string;
  group: 'pricing' | 'title' | 'safety' | 'translation';
}

export interface InsightItem {
  keyword: string;
  score: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface PublishTask {
  id: string;
  platform: 'Shopee' | 'TikTok Shop' | '淘宝';
  title: string;
  status: 'pending' | 'completed' | 'failed';
  reason?: string;
  productId?: string;
}

export const mockProducts: Product[] = [
  {
    id: 'p1',
    title: '韩版童装连衣裙夏季女童公主裙',
    source: '1688',
    sourceUrl: 'https://detail.1688.com/offer/example-01',
    priceCny: 28.5,
    status: 'raw',
    category: '童装',
    thumb: 'https://placehold.co/80x80/pink/white?text=%E5%85%AC%E4%B8%BB',
    targetLocale: 'vi-VN',
    skuCount: 8,
    imageCount: 9,
    capturedAt: '2026-05-30T08:00:00Z',
    fromExtension: true,
  },
  {
    id: 'p2',
    title: '儿童纯棉短袖T恤男童打底衫',
    source: '淘宝',
    sourceUrl: 'https://item.taobao.com/item.htm?id=example02',
    priceCny: 19.9,
    status: 'processing',
    category: 'T恤',
    thumb: 'https://placehold.co/80x80/blue/white?text=T%E6%81%A4',
    targetLocale: 'vi-VN',
    skuCount: 12,
    imageCount: 11,
    capturedAt: '2026-05-30T09:30:00Z',
    fromExtension: true,
  },
  {
    id: 'p3',
    title: '婴儿连体衣新生儿哈衣爬服',
    source: '1688',
    sourceUrl: 'https://detail.1688.com/offer/example-03',
    priceCny: 35,
    status: 'ready',
    category: '童装',
    thumb: 'https://placehold.co/80x80/green/white?text=%E8%BF%9E%E4%BD%93%E8%A1%A3',
    targetLocale: 'vi-VN',
    skuCount: 6,
    imageCount: 8,
    capturedAt: '2026-05-29T14:20:00Z',
    fromExtension: false,
  },
  {
    id: 'p4',
    title: '泰式儿童防晒外套轻薄透气',
    source: '1688',
    sourceUrl: 'https://detail.1688.com/offer/example-04',
    priceCny: 44.8,
    status: 'ready',
    category: '外套',
    thumb: 'https://placehold.co/80x80/yellow/black?text=%E9%98%B2%E6%99%92',
    targetLocale: 'th-TH',
    skuCount: 5,
    imageCount: 10,
    capturedAt: '2026-05-29T16:45:00Z',
    fromExtension: true,
  },
  {
    id: 'p5',
    title: '女童牛仔背带裤夏款百搭',
    source: '拼多多',
    sourceUrl: 'https://mobile.yangkeduo.com/goods5',
    priceCny: 27.2,
    status: 'published',
    category: '裤子',
    thumb: 'https://placehold.co/80x80/blue/white?text=%E8%83%8C%E5%B8%A6%E8%A3%A4',
    targetLocale: 'th-TH',
    skuCount: 4,
    imageCount: 7,
    capturedAt: '2026-05-28T11:00:00Z',
    fromExtension: true,
  },
  {
    id: 'p6',
    title: '韩版宽松卫衣女童连帽',
    source: '天猫',
    sourceUrl: 'https://detail.tmall.com/item.htm?id=example06',
    priceCny: 52.0,
    status: 'raw',
    category: '卫衣',
    thumb: 'https://placehold.co/80x80/purple/white?text=%E5%8D%AB%E8%A1%A3',
    targetLocale: 'vi-VN',
    skuCount: 10,
    imageCount: 12,
    capturedAt: '2026-05-30T10:15:00Z',
    fromExtension: true,
  },
  {
    id: 'p7',
    title: '男童运动短裤透气速干',
    source: '1688',
    sourceUrl: 'https://detail.1688.com/offer/example-07',
    priceCny: 18.5,
    status: 'raw',
    category: '裤子',
    thumb: 'https://placehold.co/80x80/black/white?text=%E7%9F%AD%E8%A3%A4',
    targetLocale: 'th-TH',
    skuCount: 6,
    imageCount: 8,
    capturedAt: '2026-05-30T11:30:00Z',
    fromExtension: true,
  },
  {
    id: 'p8',
    title: '儿童纯棉袜子卡通款3双装',
    source: '拼多多',
    sourceUrl: 'https://mobile.yangkeduo.com/goods8',
    priceCny: 12.8,
    status: 'processing',
    category: '配件',
    thumb: 'https://placehold.co/80x80/rainbow/white?text=%E8%A2%9C%E5%AD%90',
    targetLocale: 'vi-VN',
    skuCount: 9,
    imageCount: 6,
    capturedAt: '2026-05-29T15:00:00Z',
    fromExtension: false,
  },
];

export const mockTemplates: TemplateItem[] = [
  { id: 't1', name: '童装 · 标题优化', status: 'active', note: '首期跑通模板（会议策略）', language: '中文/越南语' },
  { id: 't2', name: '男装 · 标题优化', status: 'draft', note: '待童装验证后扩展', language: '中文/泰语' },
  { id: 't3', name: '女装 · 标题优化', status: 'draft', note: '待扩展', language: '中文/越南语' },
];

export const mockRules: RuleItem[] = [
  { name: '越南 Shopee 定价', expr: 'price_vnd = price_cny * 3500 * 2.5', group: 'pricing' },
  { name: '泰国 THB 定价', expr: 'price_thb = price_cny * 5.2 * 1.8', group: 'pricing' },
  { name: '标题字数', expr: 'len(title) <= 20', group: 'title' },
  { name: '违禁词过滤', expr: 'remove_black_words(title, description)', group: 'safety' },
  { name: '自动翻译', expr: 'translate(title, target_locale)', group: 'translation' },
];

export const mockInsights: InsightItem[] = [
  { keyword: '纯棉', score: 96, trend: 'up' },
  { keyword: '透气', score: 92, trend: 'up' },
  { keyword: '女童', score: 85, trend: 'stable' },
  { keyword: '夏季', score: 81, trend: 'stable' },
  { keyword: '卡通', score: 79, trend: 'down' },
];

export const mockPublishTasks: PublishTask[] = [
  { id: 'pub1', platform: 'Shopee', title: '婴儿连体衣新生儿哈衣爬服', status: 'pending' },
  { id: 'pub2', platform: 'TikTok Shop', title: '儿童纯棉短袖T恤男女童打底衫', status: 'completed' },
  { id: 'pub3', platform: '淘宝', title: '泰式儿童防晒外套轻薄透气', status: 'failed', reason: '选择器失效' },
];

export const mockMetrics = {
  totalProducts: mockProducts.length,
  rawCount: mockProducts.filter((p) => p.status === 'raw').length,
  processingCount: mockProducts.filter((p) => p.status === 'processing').length,
  readyCount: mockProducts.filter((p) => p.status === 'ready').length,
  publishedCount: mockProducts.filter((p) => p.status === 'published').length,
};

export type NavItem = { to: string; label: string; end?: boolean };

export const navItems: NavItem[] = [
  { to: '/app', label: '工作台', end: true },
  { to: '/app/inbox', label: '采集箱' },
  { to: '/app/batch-collect', label: '批量采集' },
  { to: '/app/templates', label: '类目模板' },
  { to: '/app/rules', label: '规则库' },
  { to: '/app/insights', label: '选品洞察' },
  { to: '/app/publish', label: '发布中心' },
  { to: '/app/settings', label: '设置' },
];
