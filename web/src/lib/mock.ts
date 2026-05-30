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
    thumb: 'https://placehold.co/80x80/e2e8f0/64748b?text=P1',
    targetLocale: 'vi-VN',
  },
  {
    id: 'p2',
    title: '儿童纯棉短袖T恤男女童打底衫',
    source: '淘宝',
    sourceUrl: 'https://item.taobao.com/item.htm?id=example02',
    priceCny: 19.9,
    status: 'processing',
    category: '童装',
    thumb: 'https://placehold.co/80x80/e2e8f0/64748b?text=P2',
    targetLocale: 'vi-VN',
  },
  {
    id: 'p3',
    title: '婴儿连体衣新生儿哈衣爬服',
    source: '链接采集',
    sourceUrl: 'https://example.com/product/3',
    priceCny: 35,
    status: 'ready',
    category: '童装',
    thumb: 'https://placehold.co/80x80/e2e8f0/64748b?text=P3',
    targetLocale: 'vi-VN',
  },
  {
    id: 'p4',
    title: '泰式儿童防晒外套轻薄透气',
    source: '1688',
    sourceUrl: 'https://detail.1688.com/offer/example-04',
    priceCny: 44.8,
    status: 'ready',
    category: '童装',
    thumb: 'https://placehold.co/80x80/e2e8f0/64748b?text=P4',
    targetLocale: 'th-TH',
  },
  {
    id: 'p5',
    title: '女童牛仔背带裤夏款百搭',
    source: '拼多多',
    sourceUrl: 'https://mobile.yangkeduo.com/goods5',
    priceCny: 27.2,
    status: 'published',
    category: '童装',
    thumb: 'https://placehold.co/80x80/e2e8f0/64748b?text=P5',
    targetLocale: 'th-TH',
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
  { keyword: '纯棉', score: 92 },
  { keyword: '透气', score: 88 },
  { keyword: '女童', score: 85 },
  { keyword: '夏季', score: 81 },
  { keyword: '公主裙', score: 79 },
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
