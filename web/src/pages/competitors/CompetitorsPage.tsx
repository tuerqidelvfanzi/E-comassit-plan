/**
 * 竞品分析 - 会议 12:00-17:00 共识版本
 *
 * 流程（来自会议原文）：
 *   1. 输入商品链接（淘宝 / 天猫 / 1688 / 拼多多 / Shopee / TikTok 等）
 *   2. 后端抓取商品信息（标题、价格、款式、销量、店铺、评价等）
 *   3. 自动分析：标题卖点提取 / 价格区间定位 / 款式趋势 / 风险项
 *   4. 输出结论（结论性卡片 + 行动建议）
 *
 * 设计约束：用户侧不接触大模型/LLM 配置，由后端处理。
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, Card, Button, Badge, Input } from '../../components/ui';

type Platform = 'taobao' | 'tmall' | '1688' | 'pinduoduo' | 'shopee' | 'tiktok' | 'other';

const PLATFORM_PATTERNS: { pattern: RegExp; platform: Platform; label: string }[] = [
  { pattern: /item\.taobao\.com|taobao\.com/i, platform: 'taobao', label: '淘宝' },
  { pattern: /detail\.tmall\.com|chaoshi\.detail\.tmall/i, platform: 'tmall', label: '天猫' },
  { pattern: /detail\.1688\.com|1688\.com/i, platform: '1688', label: '1688' },
  { pattern: /yangkeduo\.com|pinduoduo\.com/i, platform: 'pinduoduo', label: '拼多多' },
  { pattern: /shopee\./i, platform: 'shopee', label: 'Shopee' },
  { pattern: /tiktok\.com|抖音|douyin/i, platform: 'tiktok', label: 'TikTok / 抖音' },
];

const PLATFORM_LABEL: Record<Platform, string> = {
  taobao: '淘宝',
  tmall: '天猫',
  '1688': '1688',
  pinduoduo: '拼多多',
  shopee: 'Shopee',
  tiktok: 'TikTok / 抖音',
  other: '其他',
};

function detectPlatform(url: string): Platform {
  for (const p of PLATFORM_PATTERNS) {
    if (p.pattern.test(url)) return p.platform;
  }
  return 'other';
}

type Conclusion = {
  product: {
    title: string;
    price: number;
    currency: string;
    thumbnail: string;
    sales: number;
    shop: string;
    rating: number;
    platform: Platform;
  };
  titleSignals: { keyword: string; count: number; signal: 'positive' | 'neutral' | 'negative' }[];
  pricePosition: { min: number; max: number; median: number; verdict: 'lower' | 'average' | 'higher' };
  highlights: string[];
  risks: string[];
  recommendations: { label: string; to?: string; action?: 'collect' }[];
};

const MOCK_RESULT: Conclusion = {
  product: {
    title: '【热销爆款】2024夏季新款女童纯棉卡通印花短袖T恤 韩版休闲百搭上衣',
    price: 28.8,
    currency: 'CNY',
    thumbnail: 'https://placehold.co/240x240/pink/white?text=Sample',
    sales: 5680,
    shop: '韩都衣舍童装旗舰店',
    rating: 4.8,
    platform: 'tmall',
  },
  titleSignals: [
    { keyword: '纯棉', count: 1, signal: 'positive' },
    { keyword: '夏季新款', count: 1, signal: 'positive' },
    { keyword: '女童', count: 1, signal: 'positive' },
    { keyword: '韩版', count: 1, signal: 'neutral' },
    { keyword: '卡通印花', count: 1, signal: 'positive' },
    { keyword: '百搭', count: 1, signal: 'positive' },
    { keyword: '热销爆款', count: 1, signal: 'neutral' },
  ],
  pricePosition: { min: 18, max: 58, median: 32, verdict: 'average' },
  highlights: [
    '销量超过 5000 件，款式已被市场验证',
    '标题含 5 个高转化卖点词（纯棉 / 夏季 / 女童 / 卡通 / 百搭）',
    '店铺评分 4.8，DSR 表现稳定',
    '价格位于品类中位数附近，性价比明确',
  ],
  risks: [
    '标题含「热销爆款」营销词，对搜索权重贡献有限',
    '1688 货源同款较多，竞争激烈',
  ],
  recommendations: [
    { label: '采集同款', action: 'collect' },
    { label: '加入选品候选', to: '/app/insights' },
    { label: '基于此标题做优化', to: '/app/title-optimization' },
  ],
};

export function CompetitorsPage() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<Conclusion | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const platform = url.trim() ? detectPlatform(url) : null;

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    // 模拟后端抓取 + 分析耗时
    await new Promise((r) => setTimeout(r, 1800));
    setResult({ ...MOCK_RESULT, product: { ...MOCK_RESULT.product, platform: platform ?? 'other' } });
    setHistory((prev) => [url.trim(), ...prev.filter((u) => u !== url.trim())].slice(0, 5));
    setIsAnalyzing(false);
  };

  const verdictTone: Record<Conclusion['pricePosition']['verdict'], 'ok' | 'warn' | 'default'> = {
    lower: 'ok',
    average: 'default',
    higher: 'warn',
  };
  const verdictLabel: Record<Conclusion['pricePosition']['verdict'], string> = {
    lower: '低于行业中位',
    average: '行业中位附近',
    higher: '高于行业中位',
  };

  return (
    <>
      <PageHeader
        title="竞品分析"
        desc="输入商品链接 → 后端抓取并分析 → 输出结论（用户侧无需关心大模型配置）"
      />

      {/* Step 1 · 输入链接 */}
      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-xs font-semibold text-[var(--color-primary)]">
            1
          </span>
          <h3 className="font-medium">输入商品链接</h3>
          {platform && (
            <Badge tone="ok" className="ml-2">
              已识别: {PLATFORM_LABEL[platform]}
            </Badge>
          )}
        </div>
        <div className="flex gap-3">
          <Input
            placeholder="粘贴淘宝 / 天猫 / 1688 / 拼多多 / Shopee / TikTok 商品链接"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAnalyze} disabled={isAnalyzing || !url.trim()}>
            {isAnalyzing ? '分析中…' : '🔍 开始分析'}
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
          <span>支持平台:</span>
          <Badge>淘宝</Badge>
          <Badge>天猫</Badge>
          <Badge>1688</Badge>
          <Badge>拼多多</Badge>
          <Badge>Shopee</Badge>
          <Badge>TikTok</Badge>
        </div>
        {history.length > 0 && (
          <div className="mt-3 border-t border-[var(--color-border)] pt-3">
            <p className="text-xs text-muted mb-2">最近分析:</p>
            <div className="flex flex-wrap gap-2">
              {history.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUrl(u)}
                  className="max-w-md truncate rounded bg-[var(--color-muted)] px-2 py-1 text-xs hover:bg-[var(--color-border)]"
                  title={u}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* 分析进行中 */}
      {isAnalyzing && (
        <Card className="mb-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
            <p className="text-sm">后端正在抓取并分析商品信息…</p>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs text-muted">
            <div>○ 访问商品页</div>
            <div>○ 抽取标题/价格/SKU</div>
            <div>○ 调用 Skill 分析</div>
            <div>○ 生成结论</div>
          </div>
        </Card>
      )}

      {/* Step 2-4 · 分析结果 */}
      {result && (
        <>
          {/* 商品信息卡 */}
          <Card className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-xs font-semibold text-[var(--color-primary)]">
                2
              </span>
              <h3 className="font-medium">商品信息（后端抓取）</h3>
            </div>
            <div className="flex gap-4">
              <img
                src={result.product.thumbnail}
                alt=""
                className="h-28 w-28 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium leading-relaxed">{result.product.title}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Badge tone="ok">{PLATFORM_LABEL[result.product.platform]}</Badge>
                  <Badge>{result.product.shop}</Badge>
                  <Badge tone="ok">评分 {result.product.rating}</Badge>
                  <Badge>月销 {result.product.sales.toLocaleString()}</Badge>
                </div>
                <p className="mt-3 text-2xl font-bold text-[var(--color-primary)]">
                  ¥{result.product.price}
                </p>
              </div>
            </div>
          </Card>

          {/* Step 3 · 维度分析 */}
          <Card className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-xs font-semibold text-[var(--color-primary)]">
                3
              </span>
              <h3 className="font-medium">维度分析（标题卖点 / 价格定位）</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {/* 标题卖点提取 */}
              <div>
                <p className="text-sm font-medium mb-2">标题卖点词频</p>
                <div className="space-y-1">
                  {result.titleSignals.map((s) => (
                    <div key={s.keyword} className="flex items-center justify-between text-sm">
                      <span>{s.keyword}</span>
                      <Badge
                        tone={
                          s.signal === 'positive'
                            ? 'ok'
                            : s.signal === 'negative'
                            ? 'warn'
                            : 'default'
                        }
                      >
                        {s.signal === 'positive'
                          ? '转化贡献高'
                          : s.signal === 'negative'
                          ? '建议优化'
                          : '中性'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* 价格定位 */}
              <div>
                <p className="text-sm font-medium mb-2">价格定位（对比同类目）</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">品类最低</span>
                    <span>¥{result.pricePosition.min}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">品类最高</span>
                    <span>¥{result.pricePosition.max}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">行业中位</span>
                    <span>¥{result.pricePosition.median}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[var(--color-border)]">
                    <span className="text-muted">本品定位</span>
                    <Badge tone={verdictTone[result.pricePosition.verdict]}>
                      {verdictLabel[result.pricePosition.verdict]}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Step 4 · 输出结论 */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-xs font-semibold text-[var(--color-primary)]">
                4
              </span>
              <h3 className="font-medium">分析结论</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2 mb-4">
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">✓ 优势</p>
                <ul className="space-y-1 text-sm">
                  {result.highlights.map((h) => (
                    <li key={h}>• {h}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-3 border border-orange-200 dark:border-orange-800">
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">⚠ 风险</p>
                <ul className="space-y-1 text-sm">
                  {result.risks.map((r) => (
                    <li key={r}>• {r}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-[var(--color-border)] pt-3">
              <p className="text-sm font-medium mb-2">建议操作</p>
              <div className="flex flex-wrap gap-2">
                {result.recommendations.map((r) =>
                  r.to ? (
                    <Link key={r.label} to={r.to}>
                      <Button variant="outline">{r.label}</Button>
                    </Link>
                  ) : (
                    <Button key={r.label} variant="outline">
                      {r.label}
                    </Button>
                  ),
                )}
              </div>
            </div>
          </Card>
        </>
      )}

      {!result && !isAnalyzing && (
        <Card className="text-center py-12">
          <div className="text-4xl mb-4">🔗</div>
          <p className="text-muted">粘贴任意商品链接，立即开始竞品分析</p>
          <p className="text-xs text-muted mt-2">
            后端将抓取信息并按 Skill 流程分析，输出可执行的结论
          </p>
        </Card>
      )}
    </>
  );
}

export default CompetitorsPage;