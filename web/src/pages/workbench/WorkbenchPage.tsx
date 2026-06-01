/**
 * 工作台页面 - 整合标题优化、SKU生成等
 * V3需求: 改写层核心功能
 */
import { useState } from 'react';
import { Card } from '../../components/ui';
import { TitleOptimizer } from '../../components/title-optimizer';
import { SkuGenerator } from '../../components/sku-generator';

export function WorkbenchPage() {
  const [selectedLocale, setSelectedLocale] = useState<'vi-VN' | 'th-TH' | 'fil-PH' | 'id-ID'>('vi-VN');
  const [optimizedTitle, setOptimizedTitle] = useState('');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">工作台</h1>
        <p className="text-sm text-muted mt-1">商品处理与标题优化</p>
      </div>

      <Card className="p-4 mb-6">
        <h3 className="text-sm font-medium mb-3">选择目标平台</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'vi-VN', label: '越南Shopee', limit: '20字' },
            { id: 'th-TH', label: '泰国TikTok', limit: '220字' },
            { id: 'fil-PH', label: '菲律宾Shopee', limit: '120字' },
            { id: 'id-ID', label: '印尼Shopee', limit: '120字' }
          ].map(platform => (
            <button
              key={platform.id}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                selectedLocale === platform.id
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-muted)] hover:bg-[var(--color-border)]'
              }`}
              onClick={() => setSelectedLocale(platform.id as typeof selectedLocale)}
            >
              {platform.label} ({platform.limit})
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TitleOptimizer
          locale={selectedLocale}
          onOptimized={setOptimizedTitle}
        />
        <SkuGenerator prefix="BF" />
      </div>

      {optimizedTitle && (
        <Card className="p-4 mt-6">
          <h3 className="text-sm font-medium mb-3">优化结果预览</h3>
          <div className="p-4 rounded-lg bg-[var(--color-primary-soft)] border border-[var(--color-primary)]">
            <p className="text-lg font-medium">{optimizedTitle}</p>
          </div>
        </Card>
      )}
    </div>
  );
}

export default WorkbenchPage;
