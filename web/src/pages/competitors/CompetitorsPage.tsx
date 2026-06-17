/**
 * 竞品分析页面 - V3需求 FR-S-01
 */
import { useState } from 'react';
import { PageHeader, Card, Button, Badge, Input } from '../../components/ui';

// 模拟竞品数据
const MOCK_COMPETITORS = [
  { id: 'c1', title: '纯棉卡通印花短袖T恤男', thumbnail: 'https://placehold.co/120x120/pink/white?text=T1', gmv: 48500, ctr: 12.5, dailyOrders: 156, price: 29.9, source: 'tiktok', trend: 'up' },
  { id: 'c2', title: '夏季透气速干运动T恤', thumbnail: 'https://placehold.co/120x120/blue/white?text=T2', gmv: 36200, ctr: 9.8, dailyOrders: 98, price: 35.0, source: 'shopee', trend: 'up' },
  { id: 'c3', title: '宽松百搭纯棉打底衫', thumbnail: 'https://placehold.co/120x120/white/black?text=T3', gmv: 28500, ctr: 8.2, dailyOrders: 67, price: 22.5, source: 'tiktok', trend: 'stable' },
  { id: 'c4', title: '潮流街头风格印花T恤', thumbnail: 'https://placehold.co/120x120/black/white?text=T4', gmv: 22100, ctr: 7.5, dailyOrders: 45, price: 45.0, source: 'shopee', trend: 'down' },
  { id: 'c5', title: '韩版修身圆领短袖', thumbnail: 'https://placehold.co/120x120/gray/white?text=T5', gmv: 15800, ctr: 6.3, dailyOrders: 32, price: 28.8, source: 'tiktok', trend: 'stable' },
];

export function CompetitorsPage() {
  const [keyword, setKeyword] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!keyword.trim()) return;
    setIsAnalyzing(true);
    // 模拟分析过程
    await new Promise(r => setTimeout(r, 2000));
    setAnalysisResult({
      keywords: [
        { word: '纯棉', count: 45, trend: 'up' },
        { word: '透气', count: 38, trend: 'up' },
        { word: '卡通', count: 32, trend: 'down' },
        { word: '百搭', count: 28, trend: 'stable' },
        { word: '宽松', count: 25, trend: 'up' },
      ],
      priceRange: { min: 22.5, max: 45.0, avg: 32.24 },
      topColors: ['白色', '黑色', '蓝色'],
      topSizes: ['M', 'L', 'XL'],
    });
    setIsAnalyzing(false);
  };

  return (
    <>
      <PageHeader
        title="竞品分析"
        desc="输入关键词，分析TOP竞品的标题、价格、款式趋势"
      />

      <Card className="mb-6">
        <div className="flex gap-4">
          <Input
            placeholder="输入分析关键词，如：纯棉T恤 女童"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAnalyze} disabled={isAnalyzing || !keyword.trim()}>
            {isAnalyzing ? '分析中...' : '🔍 开始分析'}
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
          <span>分析维度:</span>
          <Badge>标题词频</Badge>
          <Badge>价格区间</Badge>
          <Badge>款式趋势</Badge>
          <Badge>热门颜色</Badge>
        </div>
      </Card>

      {analysisResult ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 关键词词频 */}
          <Card>
            <h3 className="font-medium mb-4">🔥 高频关键词 TOP10</h3>
            <div className="space-y-2">
              {analysisResult.keywords.map((k: any, i: number) => (
                <div key={k.word} className="flex items-center gap-3">
                  <span className="w-6 text-center text-muted">{i + 1}</span>
                  <span className="flex-1 font-medium">{k.word}</span>
                  <span className="text-muted">{k.count}次</span>
                  <Badge tone={k.trend === 'up' ? 'ok' : k.trend === 'down' ? 'warn' : 'default'}>
                    {k.trend === 'up' ? '↑' : k.trend === 'down' ? '↓' : '→'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* 价格区间 */}
          <Card>
            <h3 className="font-medium mb-4">💰 价格区间分析</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted">最低价</span>
                <span className="font-medium">¥{analysisResult.priceRange.min}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">最高价</span>
                <span className="font-medium">¥{analysisResult.priceRange.max}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">平均价</span>
                <span className="font-medium">¥{analysisResult.priceRange.avg.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t">
                <p className="text-sm text-muted">建议定价区间: ¥28-38</p>
              </div>
            </div>
          </Card>

          {/* 热门颜色 */}
          <Card>
            <h3 className="font-medium mb-4">🎨 热门颜色</h3>
            <div className="flex gap-3">
              {analysisResult.topColors.map((color: string) => (
                <div key={color} className="px-4 py-2 rounded-lg bg-muted">
                  {color}
                </div>
              ))}
            </div>
          </Card>

          {/* 热门尺码 */}
          <Card>
            <h3 className="font-medium mb-4">📐 热门尺码</h3>
            <div className="flex gap-3">
              {analysisResult.topSizes.map((size: string) => (
                <div key={size} className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-medium">
                  {size}
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <Card className="text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-muted">输入关键词开始竞品分析</p>
          <p className="text-xs text-muted mt-2">系统将分析TOP100竞品的标题、定价、款式等维度</p>
        </Card>
      )}

      {/* 竞品列表 */}
      <Card className="mt-6">
        <h3 className="font-medium mb-4">🏆 TOP竞品列表</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MOCK_COMPETITORS.map((c) => (
            <div key={c.id} className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition cursor-pointer">
              <img src={c.thumbnail} alt="" className="w-20 h-20 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{c.title}</p>
                <p className="text-xs text-muted mt-1">¥{c.price}</p>
                <div className="flex gap-2 mt-2 text-xs">
                  <Badge tone="ok">GMV ${c.gmv}</Badge>
                  <Badge>CTR {c.ctr}%</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

export default CompetitorsPage;
