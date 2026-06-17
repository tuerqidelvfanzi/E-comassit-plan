import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, Card, Button, Badge } from '../components/ui';
import { ApiModeBanner } from '../components/ApiModeBanner';
import { api } from '../lib/api';
import { queryKeys, useInsight } from '../hooks/useAppQueries';
import type { CompetitorProduct, ConversionData, ProfitMargin, GmvCtrFilter } from '../lib/api/types';

// 模拟竞品数据
const MOCK_COMPETITORS: CompetitorProduct[] = [
  { id: 'c1', title: '纯棉卡通印花短袖T恤男', thumbnail: 'https://placehold.co/80x80/pink/white?text=T1', gmv: 48500, ctr: 12.5, sameProductCount: 3, comments: 2847, dailyOrders: 156, price: 29.9, source: 'tiktok', trend: 'up' },
  { id: 'c2', title: '夏季透气速干运动T恤', thumbnail: 'https://placehold.co/80x80/blue/white?text=T2', gmv: 36200, ctr: 9.8, sameProductCount: 5, comments: 1893, dailyOrders: 98, price: 35.0, source: 'tiktok', trend: 'up' },
  { id: 'c3', title: '宽松百搭纯棉打底衫', thumbnail: 'https://placehold.co/80x80/white/black?text=T3', gmv: 28500, ctr: 8.2, sameProductCount: 8, comments: 1205, dailyOrders: 67, price: 22.5, source: 'shopee', trend: 'stable' },
  { id: 'c4', title: '潮流街头风格印花T恤', thumbnail: 'https://placehold.co/80x80/black/white?text=T4', gmv: 22100, ctr: 7.5, sameProductCount: 12, comments: 892, dailyOrders: 45, price: 45.0, source: 'tiktok', trend: 'down' },
  { id: 'c5', title: '韩版修身圆领短袖', thumbnail: 'https://placehold.co/80x80/gray/white?text=T5', gmv: 15800, ctr: 6.3, sameProductCount: 6, comments: 567, dailyOrders: 32, price: 28.8, source: 'shopee', trend: 'stable' },
];

// 模拟转化率数据
const MOCK_CONVERSION: ConversionData[] = [
  { date: '05-24', orders: 45, views: 890, conversionRate: 5.06, newComments: 12 },
  { date: '05-25', orders: 52, views: 920, conversionRate: 5.65, newComments: 8 },
  { date: '05-26', orders: 38, views: 780, conversionRate: 4.87, newComments: 15 },
  { date: '05-27', orders: 61, views: 1050, conversionRate: 5.81, newComments: 22 },
  { date: '05-28', orders: 73, views: 1180, conversionRate: 6.19, newComments: 18 },
  { date: '05-29', orders: 68, views: 1120, conversionRate: 6.07, newComments: 11 },
  { date: '05-30', orders: 85, views: 1350, conversionRate: 6.30, newComments: 25 },
];

// 模拟毛利数据
const MOCK_PROFITS: ProfitMargin[] = [
  { costPrice: 22.5, sellPrice: 78750, currency: 'VND', profit: 18.5, margin: 82.2 },
  { costPrice: 35.0, sellPrice: 87500, currency: 'THB', profit: 28.5, margin: 81.4 },
  { costPrice: 28.8, sellPrice: 100800, currency: 'VND', profit: 22.4, margin: 77.8 },
  { costPrice: 45.0, sellPrice: 112500, currency: 'THB', profit: 35.2, margin: 78.2 },
];

// 模拟关键词数据
const MOCK_KEYWORDS = [
  { keyword: '纯棉', score: 96, trend: 'up' as const },
  { keyword: '透气', score: 92, trend: 'up' as const },
  { keyword: '夏季', score: 88, trend: 'stable' as const },
  { keyword: '卡通', score: 85, trend: 'down' as const },
  { keyword: '百搭', score: 82, trend: 'stable' as const },
  { keyword: '宽松', score: 78, trend: 'up' as const },
  { keyword: '运动', score: 75, trend: 'up' as const },
  { keyword: '修身', score: 68, trend: 'down' as const },
];

// GMV/CTR 筛选配置
const DEFAULT_FILTER: GmvCtrFilter = {
  minGmv: 30000,
  minCtr: 5,
  maxSameProduct: 10,
  platform: 'all',
};

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <span className="text-green-500">↑</span>;
  if (trend === 'down') return <span className="text-red-500">↓</span>;
  return <span className="text-gray-400">→</span>;
}

function MetricCard({ title, value, unit, subtext, highlight }: { title: string; value: string | number; unit?: string; subtext?: string; highlight?: boolean }) {
  return (
    <Card className={`${highlight ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}`}>
      <div className="text-sm text-muted">{title}</div>
      <div className="mt-1 text-2xl font-bold">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-muted">{unit}</span>}
      </div>
      {subtext && <div className="mt-1 text-xs text-muted">{subtext}</div>}
    </Card>
  );
}

function CompetitorRow({ competitor, expanded, onToggle }: { competitor: CompetitorProduct; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border last:border-0">
      <div className="flex cursor-pointer items-center gap-3 p-3 hover:bg-muted/50" onClick={onToggle}>
        <img src={competitor.thumbnail} alt="" className="h-12 w-12 rounded-lg object-cover" />
        <div className="flex-1 min-w-0">
          <div className="truncate font-medium text-sm">{competitor.title}</div>
          <div className="flex gap-3 mt-1 text-xs text-muted">
            <span>GMV: ${competitor.gmv.toLocaleString()}</span>
            <span>CTR: {competitor.ctr}%</span>
            <span>日单: {competitor.dailyOrders}</span>
          </div>
        </div>
        <Badge tone={competitor.trend === 'up' ? 'ok' : competitor.trend === 'down' ? 'warn' : 'default'}>
          {competitor.trend === 'up' ? '上升' : competitor.trend === 'down' ? '下降' : '稳定'}
        </Badge>
        <span className="text-muted">{expanded ? '▼' : '▶'}</span>
      </div>
      {expanded && (
        <div className="bg-muted/30 p-3 text-sm">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <div><span className="text-muted">评论数:</span> {competitor.comments.toLocaleString()}</div>
            <div><span className="text-muted">同款数:</span> {competitor.sameProductCount}</div>
            <div><span className="text-muted">价格:</span> ¥{competitor.price}</div>
            <div><span className="text-muted">来源:</span> {competitor.source === 'tiktok' ? 'TikTok' : 'Shopee'}</div>
          </div>
          <div className="mt-2 flex gap-2">
            <Badge tone="ok">✓ 符合筛选</Badge>
            <Badge>查看详情</Badge>
            <Badge>采集同款</Badge>
          </div>
        </div>
      )}
    </div>
  );
}

function ConversionChart({ data }: { data: ConversionData[] }) {
  const maxOrders = Math.max(...data.map(d => d.orders));
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.date} className="flex items-center gap-2 text-sm">
          <span className="w-10 text-muted">{d.date}</span>
          <div className="flex-1 flex gap-1 items-center">
            <div className="h-4 bg-blue-500/20 rounded" style={{ width: `${(d.orders / maxOrders) * 60}%` }}>
              <div className="h-full bg-blue-500 rounded" style={{ width: `${(d.orders / maxOrders) * 100}%` }} />
            </div>
            <span className="ml-2 w-16">{d.orders}单</span>
          </div>
          <span className="text-muted w-16 text-right">{d.views}浏览</span>
          <span className={`w-14 text-right font-medium ${d.conversionRate >= 6 ? 'text-green-500' : d.conversionRate < 5 ? 'text-red-500' : ''}`}>
            {d.conversionRate}%
          </span>
          <span className="text-muted w-16 text-right">+{d.newComments}评</span>
        </div>
      ))}
    </div>
  );
}

function ProfitTable({ profits }: { profits: ProfitMargin[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted">
            <th className="py-2 text-left">成本价</th>
            <th className="py-2 text-right">售价</th>
            <th className="py-2 text-right">货币</th>
            <th className="py-2 text-right">利润</th>
            <th className="py-2 text-right">利润率</th>
          </tr>
        </thead>
        <tbody>
          {profits.map((p, i) => (
            <tr key={i} className="border-b border-border/50">
              <td className="py-2">¥{p.costPrice}</td>
              <td className="py-2 text-right">{p.sellPrice.toLocaleString()}</td>
              <td className="py-2 text-right">{p.currency}</td>
              <td className="py-2 text-right text-green-600">¥{p.profit}</td>
              <td className="py-2 text-right">
                <span className={`font-medium ${p.margin >= 80 ? 'text-green-600' : 'text-blue-600'}`}>
                  {p.margin}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KeywordsCloud({ keywords }: { keywords: typeof MOCK_KEYWORDS }) {
  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map((k) => (
        <div
          key={k.keyword}
          className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 cursor-pointer hover:bg-primary/20 transition"
          title={`搜索分数: ${k.score}`}
        >
          <span className="font-medium">{k.keyword}</span>
          <span className="text-xs text-muted">({k.score})</span>
          <TrendIcon trend={k.trend} />
        </div>
      ))}
    </div>
  );
}

export function InsightsPage() {
  const { data: insight, isLoading } = useInsight();
  const qc = useQueryClient();
  const [expandedCompetitors, setExpandedCompetitors] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<GmvCtrFilter>(DEFAULT_FILTER);
  const [activeTab, setActiveTab] = useState<'keywords' | 'competitors' | 'conversion' | 'profit'>('keywords');

  const runMut = useMutation({
    mutationFn: () => api.runInsight(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.insight }),
  });

  const toggleCompetitor = (id: string) => {
    setExpandedCompetitors(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return <PageHeader title="选品洞察" desc="加载中…" />;
  }

  // 使用模拟数据或API返回的数据
  const competitors = MOCK_COMPETITORS;
  const conversion = MOCK_CONVERSION;
  const profits = MOCK_PROFITS;
  const keywords = MOCK_KEYWORDS;

  // 根据筛选条件过滤竞品
  const filteredCompetitors = competitors.filter(c =>
    c.gmv >= filter.minGmv &&
    c.ctr >= filter.minCtr &&
    c.sameProductCount <= filter.maxSameProduct &&
    (filter.platform === 'all' || c.source === filter.platform)
  );

  return (
    <>
      <PageHeader
        title="选品洞察"
        desc="竞品分析 · 转化追踪 · 毛利评估（数据来源：Mock 静态数据，待 v2.1 接入真实 API）"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setFilter(DEFAULT_FILTER)}>
              重置筛选
            </Button>
            <Button variant="primary" disabled={runMut.isPending} onClick={() => runMut.mutate()}>
              {runMut.isPending ? '分析中…' : '🔄 重新分析'}
            </Button>
          </div>
        }
      />

      <ApiModeBanner />

      {/* 核心指标卡片 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="符合条件的竞品"
          value={filteredCompetitors.length}
          subtext={`筛选: GMV≥$${filter.minGmv/1000}K CTR≥${filter.minCtr}%`}
          highlight
        />
        <MetricCard
          title="本周GMV TOP1"
          value={`$${(filteredCompetitors[0]?.gmv ?? 0) / 1000}`}
          unit="K"
          subtext={filteredCompetitors[0]?.title?.slice(0, 15) + '...'}
        />
        <MetricCard
          title="平均点击率"
          value={(filteredCompetitors.reduce((a, c) => a + c.ctr, 0) / filteredCompetitors.length || 0).toFixed(1)}
          unit="%"
          subtext="CTR = 点击量/展现量"
        />
        <MetricCard
          title="平均利润率"
          value={(profits.reduce((a, p) => a + p.margin, 0) / profits.length || 0).toFixed(1)}
          unit="%"
          highlight
        />
      </div>

      {/* GMV/CTR 筛选器 */}
      <Card className="mb-6">
        <h3 className="font-medium mb-3">🎯 GMV/CTR 筛选条件</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">最低周GMV (USD)</label>
            <input
              type="number"
              value={filter.minGmv}
              onChange={(e) => setFilter({ ...filter, minGmv: Number(e.target.value) })}
              className="w-32 rounded border border-border bg-surface px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">最低点击率 (%)</label>
            <input
              type="number"
              value={filter.minCtr}
              step="0.1"
              onChange={(e) => setFilter({ ...filter, minCtr: Number(e.target.value) })}
              className="w-24 rounded border border-border bg-surface px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">最大同款数</label>
            <input
              type="number"
              value={filter.maxSameProduct}
              onChange={(e) => setFilter({ ...filter, maxSameProduct: Number(e.target.value) })}
              className="w-24 rounded border border-border bg-surface px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">平台</label>
            <select
              value={filter.platform}
              onChange={(e) => setFilter({ ...filter, platform: e.target.value as GmvCtrFilter['platform'] })}
              className="rounded border border-border bg-surface px-3 py-1.5 text-sm"
            >
              <option value="all">全部</option>
              <option value="tiktok">TikTok</option>
              <option value="shopee">Shopee</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
          <span>💡 筛选说明:</span>
          <span>• 周GMV≥${filter.minGmv.toLocaleString()} = 高销量的爆品</span>
          <span>• CTR≥{filter.minCtr}% = 主图引流能力强</span>
          <span>• 同款数≤{filter.maxSameProduct} = 竞争度低</span>
        </div>
      </Card>

      {/* Tab 导航 */}
      <div className="mb-4 flex gap-1 border-b border-border">
        {[
          { key: 'keywords', label: '📊 关键词洞察', count: keywords.length },
          { key: 'competitors', label: '🏆 竞品TOP10', count: filteredCompetitors.length },
          { key: 'conversion', label: '📈 转化率分析', count: 7 },
          { key: 'profit', label: '💰 毛利/价差', count: profits.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {tab.label}
            <Badge className="ml-2">{tab.count}</Badge>
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {activeTab === 'keywords' && (
          <>
            <Card>
              <h3 className="font-medium mb-3">🔥 高转化关键词</h3>
              <p className="text-sm text-muted mb-4">
                基于TOP竞品的标题分析，括号内为搜索热度分数，↑表示上升趋势
              </p>
              <KeywordsCloud keywords={keywords} />
              <div className="mt-4 pt-3 border-t border-border text-xs text-muted">
                <div className="flex gap-4">
                  <span>↑ 上升趋势</span>
                  <span>↓ 下降趋势</span>
                  <span>→ 稳定</span>
                </div>
              </div>
            </Card>
            <Card>
              <h3 className="font-medium mb-3">💡 关键词分析建议</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span>
                  <span>标题开头优先使用「纯棉」「透气」等高热词</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span>
                  <span>「卡通」「宽松」类词汇转化效果好</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-500">⚠</span>
                  <span>「修身」类词汇热度下降，建议减少使用</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500">ℹ</span>
                  <span>可组合使用：纯棉+透气+夏季+宽松</span>
                </li>
              </ul>
            </Card>
          </>
        )}

        {activeTab === 'competitors' && (
          <>
            <Card className="lg:col-span-2">
              <h3 className="font-medium mb-3">🏆 竞品TOP10（符合筛选条件）</h3>
              <p className="text-sm text-muted mb-4">
                点击展开查看详情，可直接采集符合条件的好品
              </p>
              <div className="divide-y divide-border">
                {filteredCompetitors.length === 0 ? (
                  <div className="p-8 text-center text-muted">
                    <p>没有符合条件的竞品</p>
                    <p className="text-sm mt-2">尝试放宽筛选条件</p>
                  </div>
                ) : (
                  filteredCompetitors.map(c => (
                    <CompetitorRow
                      key={c.id}
                      competitor={c}
                      expanded={expandedCompetitors.has(c.id)}
                      onToggle={() => toggleCompetitor(c.id)}
                    />
                  ))
                )}
              </div>
            </Card>
          </>
        )}

        {activeTab === 'conversion' && (
          <>
            <Card>
              <h3 className="font-medium mb-3">📈 7天转化率趋势</h3>
              <p className="text-sm text-muted mb-4">
                订单数(蓝条) vs 浏览量 vs 转化率(右侧)
              </p>
              <ConversionChart data={conversion} />
            </Card>
            <Card>
              <h3 className="font-medium mb-3">📊 转化率分析</h3>
              <div className="space-y-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm font-medium text-green-700 dark:text-green-400">整体趋势: 上升</div>
                  <div className="text-xs text-muted mt-1">转化率从5.06%提升至6.30%，增长24.5%</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted">平均转化率</div>
                    <div className="text-lg font-bold">5.71%</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted">最高转化率</div>
                    <div className="text-lg font-bold text-green-600">6.30%</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted">总订单</div>
                    <div className="text-lg font-bold">422</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted">总浏览</div>
                    <div className="text-lg font-bold">7,290</div>
                  </div>
                </div>
                <div className="text-sm text-muted">
                  <p>💡 优化建议:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• 周末转化率明显高于工作日，可增加上新频率</li>
                    <li>• 评论增长与转化正相关，加强客服响应</li>
                    <li>• CTR≥6%的商品主图值得参考</li>
                  </ul>
                </div>
              </div>
            </Card>
          </>
        )}

        {activeTab === 'profit' && (
          <>
            <Card>
              <h3 className="font-medium mb-3">💰 毛利/价差分析</h3>
              <p className="text-sm text-muted mb-4">
                成本价 vs 目标市场售价 = 利润空间
              </p>
              <ProfitTable profits={profits} />
            </Card>
            <Card>
              <h3 className="font-medium mb-3">📋 价格计算公式</h3>
              <div className="space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium mb-2">🇻🇳 越南 Shopee</div>
                  <div className="text-xs text-muted font-mono">
                    售价(VND) = 成本价(CNY) × 3.5 × 2.5 × 汇率
                  </div>
                  <div className="text-xs text-muted mt-1">
                    示例: ¥22.5 × 3.5 = ¥78.75 → ₫78,750
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium mb-2">🇹🇭 泰国 TikTok</div>
                  <div className="text-xs text-muted font-mono">
                    售价(THB) = 成本价(CNY) × 2.5 × 汇率
                  </div>
                  <div className="text-xs text-muted mt-1">
                    示例: ¥35 × 2.5 = ฿87.5
                  </div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm font-medium text-green-700 dark:text-green-400">✅ 利润率说明</div>
                  <ul className="mt-2 text-xs text-muted space-y-1">
                    <li>• ≥80%: 高利润商品，优先选品</li>
                    <li>• 70-80%: 正常利润，可接受</li>
                    <li>• &lt;70%: 利润偏薄，需谨慎</li>
                  </ul>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* 底部说明 */}
      <Card className="mt-6 bg-blue-50/50 dark:bg-blue-900/20 border-blue-200">
        <h3 className="font-medium mb-2">📝 功能说明</h3>
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="font-medium">GMV/CTR 筛选</p>
            <p className="text-muted text-xs">根据周GMV和点击率筛选高潜力爆品，同款数越少竞争越小</p>
          </div>
          <div>
            <p className="font-medium">竞品TOP10</p>
            <p className="text-muted text-xs">展示符合条件的竞品数据，点击展开可查看详情并采集同款</p>
          </div>
          <div>
            <p className="font-medium">转化率分析</p>
            <p className="text-muted text-xs">追踪订单/浏览/评论趋势，分析最佳上新时间</p>
          </div>
          <div>
            <p className="font-medium">毛利/价差</p>
            <p className="text-muted text-xs">自动计算各市场定价和利润率，指导选品决策</p>
          </div>
        </div>
      </Card>
    </>
  );
}
