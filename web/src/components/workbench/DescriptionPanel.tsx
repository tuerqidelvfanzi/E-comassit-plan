/**
 * 描述改写面板
 * V3需求: FR-RW-02 描述改写
 */
import { useState } from 'react';
import { Card, Button, Badge } from '../ui';
import { 
  generateLocalizedDescription, 
  validateShortDescription,
  AFTERSALE_MESSAGES,
  CARE_INSTRUCTIONS
} from '../../../../shared/src/description';

const LOCALES = [
  { id: 'vi-VN', name: '越南Shopee', flag: '🇻🇳' },
  { id: 'th-TH', name: '泰国TikTok', flag: '🇹🇭' },
  { id: 'fil-PH', name: '菲律宾Shopee', flag: '🇵🇭' },
  { id: 'id-ID', name: '印尼Shopee', flag: '🇮🇩' },
];

export function DescriptionPanel() {
  const [locale, setLocale] = useState('vi-VN');
  const [originalDesc, setOriginalDesc] = useState('2024夏季新款可爱卡通小熊图案印花纯棉短袖T恤儿童百搭休闲上衣，适合3-12岁儿童');
  const [keywords, setKeywords] = useState(['T恤', '短袖', '纯棉', '儿童', '卡通']);
  const [generatedDesc, setGeneratedDesc] = useState<ReturnType<typeof generateLocalizedDescription> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1000));
    
    const desc = generateLocalizedDescription(locale, originalDesc, keywords);
    setGeneratedDesc(desc);
    setIsGenerating(false);
  };

  const localeConfig = LOCALES.find(l => l.id === locale);
  const shortDescValidation = generatedDesc 
    ? validateShortDescription(generatedDesc.shortDescription, locale)
    : null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-medium">描述改写</h2>
          <p className="text-xs text-muted">FR-RW-02 · 短描述≤20字 · 本地化翻译</p>
        </div>
        <Badge tone="ok">已实现</Badge>
      </div>

      {/* 目标市场选择 */}
      <div className="mb-4">
        <label className="text-sm text-muted">目标市场</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {LOCALES.map(loc => (
            <button
              key={loc.id}
              onClick={() => setLocale(loc.id)}
              className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                locale === loc.id
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-muted)]'
              }`}
            >
              <span>{loc.flag}</span>
              <span>{loc.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 原始描述 */}
      <div className="mb-4">
        <label className="text-sm text-muted">原始描述（中文）</label>
        <textarea
          value={originalDesc}
          onChange={(e) => setOriginalDesc(e.target.value)}
          className="mt-1 w-full p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm resize-y"
          rows={3}
        />
      </div>

      {/* 关键词提取 */}
      <div className="mb-4">
        <label className="text-sm text-muted">提取的关键词</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {keywords.map((kw, i) => (
            <span key={i} className="px-2 py-1 bg-[var(--color-muted)] rounded text-xs">{kw}</span>
          ))}
        </div>
      </div>

      <Button className="w-full" onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? '生成中...' : '🎯 生成本地化描述'}
      </Button>

      {/* 生成结果 */}
      {generatedDesc && (
        <div className="mt-4 space-y-3">
          {/* 短描述（越南特殊要求） */}
          {locale === 'vi-VN' && (
            <div className="p-3 rounded-lg bg-[var(--color-primary-soft)] border border-[var(--color-primary)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">🇻🇳 越南短描述（≤20字）</span>
                <span className={`text-xs ${shortDescValidation?.valid ? 'text-green-600' : 'text-red-600'}`}>
                  {shortDescValidation?.charCount}/20 {shortDescValidation?.valid ? '✓' : '✗'}
                </span>
              </div>
              <p className="text-sm">{generatedDesc.shortDescription}</p>
            </div>
          )}

          {/* 主描述 */}
          <div className="p-3 rounded-lg bg-[var(--color-muted)]">
            <span className="text-sm font-medium">📝 主描述</span>
            <p className="mt-1 text-sm whitespace-pre-line">{generatedDesc.mainDescription}</p>
          </div>

          {/* 规格参数 */}
          <div className="p-3 rounded-lg bg-[var(--color-muted)]">
            <span className="text-sm font-medium">📋 规格参数</span>
            <pre className="mt-1 text-xs whitespace-pre-wrap">{generatedDesc.specsSection}</pre>
          </div>

          {/* 物流/售后 */}
          <div className="p-3 rounded-lg bg-[var(--color-muted)]">
            <span className="text-sm font-medium">🚚 物流与售后</span>
            <pre className="mt-1 text-xs whitespace-pre-wrap">{generatedDesc.shippingSection}</pre>
          </div>

          {/* 洗护说明 */}
          <div className="p-3 rounded-lg bg-[var(--color-muted)]">
            <span className="text-sm font-medium">🧺 洗护说明</span>
            <pre className="mt-1 text-xs whitespace-pre-wrap">{generatedDesc.careSection}</pre>
          </div>
        </div>
      )}
    </Card>
  );
}

export default DescriptionPanel;
