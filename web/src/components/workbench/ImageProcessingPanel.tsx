/**
 * 图片处理面板
 * V3需求: FR-RW-04 图片改写
 */
import { useState } from 'react';
import { Card, Button, Badge } from '../ui';
import { 
  validateImageCount, 
  detectImageIssues, 
  IMAGE_REQUIREMENTS,
  getImageProcessingSuggestions,
  type ImageIssue
} from '../../../../shared/src/image';

const SAMPLE_IMAGES = [
  'https://img.alicdn.com/imgextra/1.jpg',
  'https://img.alicdn.com/imgextra/2.jpg',
  'https://img.alicdn.com/imgextra/3.jpg',
  'https://img.alicdn.com/imgextra/4.jpg',
  'https://img.alicdn.com/imgextra/5.jpg',
  'https://img.alicdn.com/imgextra/6.jpg',
  'https://img.alicdn.com/imgextra/7.jpg',
  'https://img.alicdn.com/imgextra/8.jpg',
  'https://img.alicdn.com/imgextra/9.jpg',
];

const LOCALES = [
  { id: 'vi-VN', name: '越南Shopee', flag: '🇻🇳' },
  { id: 'th-TH', name: '泰国TikTok', flag: '🇹🇭' },
  { id: 'fil-PH', name: '菲律宾Shopee', flag: '🇵🇭' },
];

export function ImageProcessingPanel() {
  const [locale, setLocale] = useState('vi-VN');
  const [images] = useState(SAMPLE_IMAGES);
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const [issues, setIssues] = useState<Record<string, ImageIssue[]>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const requirements = IMAGE_REQUIREMENTS[locale];
  const countIssue = validateImageCount(images, locale);
  const suggestions = getImageProcessingSuggestions(locale);

  const handleProcess = async () => {
    setIsProcessing(true);
    setProcessedImages([]);
    setIssues({});

    // 检测每个图片的问题
    const allIssues: Record<string, ImageIssue[]> = {};
    
    for (const img of images) {
      const imgIssues = detectImageIssues(img);
      if (imgIssues.length > 0) {
        allIssues[img] = imgIssues;
      }
    }
    setIssues(allIssues);

    // 模拟处理
    await new Promise(r => setTimeout(r, 1500));
    setProcessedImages([...images]);
    setIsProcessing(false);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-medium">图片处理</h2>
          <p className="text-xs text-muted">FR-RW-04 · 数量/尺寸/消除笔/白底</p>
        </div>
        <Badge tone="ok">已实现</Badge>
      </div>

      {/* 目标市场 */}
      <div className="mb-4">
        <label className="text-sm text-muted">目标市场</label>
        <div className="flex gap-2 mt-1">
          {LOCALES.map(loc => (
            <button
              key={loc.id}
              onClick={() => setLocale(loc.id)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                locale === loc.id
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-muted)]'
              }`}
            >
              {loc.flag} {loc.name}
            </button>
          ))}
        </div>
      </div>

      {/* 图片要求 */}
      <div className="mb-4 p-3 rounded-lg bg-[var(--color-muted)]">
        <h4 className="text-sm font-medium mb-2">📋 {requirements.name} 图片要求</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>• 数量: {requirements.minCount}-{requirements.maxCount}张</div>
          <div>• 尺寸: {requirements.minSize}x{requirements.minSize} ({requirements.aspectRatio})</div>
          {requirements.mainImageWhiteBg && (
            <div className="col-span-2">• 第一张必须为白底主图</div>
          )}
        </div>
      </div>

      {/* 当前图片数量状态 */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm">
          <span>当前图片数量</span>
          <span className={countIssue ? 'text-red-500' : 'text-green-600'}>
            {images.length} 张 {countIssue ? '❌' : '✓'}
          </span>
        </div>
        {countIssue && (
          <p className="text-xs text-red-500 mt-1">{countIssue.message}</p>
        )}
      </div>

      {/* 检测到的问题 */}
      {Object.keys(issues).length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <h4 className="text-sm font-medium mb-2">⚠️ 检测到的问题</h4>
          {Object.entries(issues).map(([img, imgIssues]) => (
            <div key={img} className="text-xs mb-1">
              <span className="text-muted">图片:</span>
              {imgIssues.map((issue, i) => (
                <span key={i} className="ml-1 text-yellow-600">{issue.message}</span>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <Button className="flex-1" onClick={handleProcess} disabled={isProcessing}>
          {isProcessing ? '处理中...' : '🔧 批量处理图片'}
        </Button>
      </div>

      {/* 处理后的图片 */}
      {processedImages.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">✅ 处理结果</h4>
          <div className="grid grid-cols-3 gap-2">
            {processedImages.map((img, i) => (
              <div 
                key={i} 
                className={`aspect-square rounded-lg bg-[var(--color-muted)] flex items-center justify-center text-xs ${
                  i === 0 && requirements.mainImageWhiteBg ? 'ring-2 ring-[var(--color-primary)]' : ''
                }`}
              >
                {i === 0 && requirements.mainImageWhiteBg && (
                  <span className="absolute text-[10px] bg-[var(--color-primary)] text-white px-1 rounded">主图</span>
                )}
                <span className="text-muted">图{i + 1}</span>
                {i === 0 && requirements.mainImageWhiteBg && <span className="absolute text-[10px]">白底</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 处理建议 */}
      <div className="p-3 rounded-lg bg-[var(--color-muted)]">
        <h4 className="text-xs font-medium mb-2">💡 处理建议</h4>
        <ul className="text-xs text-muted space-y-1">
          {suggestions.map((s, i) => (
            <li key={i}>• {s}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export default ImageProcessingPanel;
