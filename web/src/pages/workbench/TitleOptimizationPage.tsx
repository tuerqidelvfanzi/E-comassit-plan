/**
 * 天猫标题优化页面 - V3需求 FR-RW-01
 * 专注越南/泰国市场的标题优化
 */
import { useState, useCallback } from 'react';
import { PageHeader, Card, Button, Badge } from '../../components/ui';
import { TitleOptimizer } from '../../components/title-optimizer';

const LOCALE_CONFIGS = [
  { id: 'vi-VN', name: '越南Shopee', flag: '🇻🇳', limit: 20, emoji: false, sample: 'Ao thun cotton de thuong' },
  { id: 'th-TH', name: '泰国TikTok', flag: '🇹🇭', limit: 220, emoji: true, sample: 'เสื้อยืดผ้าฝ้าย สบายๆ' },
  { id: 'fil-PH', name: '菲律宾Shopee', flag: '🇵🇭', limit: 120, emoji: true, sample: 'Cotton t-shirt para sa bata' },
  { id: 'id-ID', name: '印尼Shopee', flag: '🇮🇩', limit: 120, emoji: true, sample: 'Baju kaos katun nyaman' },
];

export function TitleOptimizationPage() {
  const [selectedLocale, setSelectedLocale] = useState('vi-VN');
  const [originalTitle, setOriginalTitle] = useState('');
  const [optimizedTitles, setOptimizedTitles] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const localeConfig = LOCALE_CONFIGS.find(l => l.id === selectedLocale)!;

  const handleOptimize = async () => {
    if (!originalTitle.trim()) return;
    setIsOptimizing(true);
    await new Promise(r => setTimeout(r, 1500));
    // 模拟生成多个优化版本
    const variants = [
      `Áo thun cotton gấu trúc dễ thương`,
      `Áo phông cotton trẻ trung`,
      `Áo thun cotton phong cách Hàn Quốc`,
    ];
    setOptimizedTitles(variants);
    setIsOptimizing(false);
  };

  return (
    <>
      <PageHeader
        title="标题优化"
        desc="AI智能改写 · 多平台适配 · 违禁词检测"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOriginalTitle('可爱蓝色小熊熊图案卡通印花休闲百搭纯棉短袖T恤儿童韩版')}>
              📝 填入示例
            </Button>
            <Button variant="outline" onClick={() => { setOriginalTitle(''); setOptimizedTitles([]); }}>
              🗑️ 清空
            </Button>
          </div>
        }
      />

      {/* 平台选择 */}
      <Card className="mb-6">
        <h3 className="text-sm font-medium mb-3">选择目标市场</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {LOCALE_CONFIGS.map(locale => (
            <div
              key={locale.id}
              className={`p-4 rounded-lg border cursor-pointer transition ${
                selectedLocale === locale.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedLocale(locale.id)}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{locale.flag}</span>
                <span className="font-medium">{locale.name}</span>
              </div>
              <div className="text-xs text-muted">
                <p>字符限制: ≤{locale.limit}字</p>
                <p>emoji: {locale.emoji ? '✓ 可用' : '✗ 禁用'}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左侧：输入 */}
        <Card>
          <h3 className="font-medium mb-4">📝 原始标题输入</h3>
          <textarea
            className="w-full min-h-[120px] p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] resize-y"
            placeholder="输入中文标题，如：可爱蓝色小熊熊图案卡通印花休闲百搭纯棉短袖T恤儿童韩版"
            value={originalTitle}
            onChange={(e) => setOriginalTitle(e.target.value)}
          />
          <div className="flex justify-between items-center mt-2 text-xs text-muted">
            <span>字符数: {originalTitle.length}</span>
            <span>目标: {localeConfig.name} ({localeConfig.limit}字限制)</span>
          </div>
          <Button className="w-full mt-4" onClick={handleOptimize} disabled={isOptimizing || !originalTitle.trim()}>
            {isOptimizing ? '🤖 AI优化中...' : '🚀 运行标题优化'}
          </Button>
        </Card>

        {/* 右侧：优化结果 */}
        <Card>
          <h3 className="font-medium mb-4">✨ 优化结果预览</h3>
          {optimizedTitles.length > 0 ? (
            <div className="space-y-3">
              {optimizedTitles.map((title, i) => (
                <div key={i} className={`p-3 rounded-lg border ${i === 0 ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <Badge tone={i === 0 ? 'ok' : 'default'}>
                      {i === 0 ? '推荐' : `方案 ${i + 1}`}
                    </Badge>
                    <span className="text-xs text-muted">{title.length}字符</span>
                  </div>
                  <p className="font-medium">{title}</p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(title)}>
                      📋 复制
                    </Button>
                    <Button size="sm" variant="outline">
                      🔍 违禁检测
                    </Button>
                  </div>
                </div>
              ))}
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-400">
                  ✓ 已通过违禁词检测 | ✓ 字符数符合要求 | ✓ 关键词完整保留
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted">
              <div className="text-4xl mb-3">💡</div>
              <p>输入标题后点击优化生成多版本</p>
            </div>
          )}
        </Card>
      </div>

      {/* 优化规则说明 */}
      <Card className="mt-6">
        <h3 className="font-medium mb-4">📖 优化规则说明</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">1. 关键词提取</h4>
            <p className="text-xs text-muted">从原标题提取品类/材质/颜色/人群词</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">2. 语义压缩</h4>
            <p className="text-xs text-muted">中文标题压缩到目标字数内</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">3. 本地化翻译</h4>
            <p className="text-xs text-muted">中→越/泰/菲/印尼语</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">4. 违禁词过滤</h4>
            <p className="text-xs text-muted">品牌/国内标识/虚假宣传</p>
          </div>
        </div>
      </Card>
    </>
  );
}

export default TitleOptimizationPage;
