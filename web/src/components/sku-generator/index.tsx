/**
 * SKU生成器组件
 * V3需求: FR-RW-03 SKU改写
 */
import { useState } from 'react';
import { Card, Button } from '../ui';
import { generateSkuMatrix, COLOR_CODES, SIZE_CODES, SIZE_BY_GENDER, type SkuMatrix, type GeneratedSku } from '../../../../shared/src/sku';

interface SkuGeneratorProps {
  prefix?: string;
  onGenerated?: (skus: GeneratedSku[]) => void;
}

export function SkuGenerator({ prefix = 'BF', onGenerated }: SkuGeneratorProps) {
  const [prefixVal, setPrefix] = useState(prefix);
  const [sequence, setSequence] = useState(1);
  const [side, setSide] = useState<'P' | 'R' | 'PR'>('PR');
  const [colors, setColors] = useState(['白色', '黑色', '蓝色']);
  const [sizes, setSizes] = useState(['S', 'M', 'L', 'XL']);
  const [gender, setGender] = useState<string>('童装');
  const [isSingleColor, setIsSingleColor] = useState(false);
  const [hasPrint, setHasPrint] = useState(false);
  const [generatedMatrix, setGeneratedMatrix] = useState<SkuMatrix | null>(null);

  const handleGenderChange = (newGender: string) => {
    setGender(newGender);
    const newSizes = SIZE_BY_GENDER[newGender] || ['S', 'M', 'L', 'XL'];
    setSizes(newSizes);
  };

  const handleGenerate = () => {
    const config = {
      prefix: prefixVal.toUpperCase(),
      sequence,
      side,
      colors,
      sizes,
      isSingleColor,
      hasPrint
    };
    const matrix = generateSkuMatrix(config);
    setGeneratedMatrix(matrix);
    onGenerated?.(matrix.skus);
  };

  const colorOptions = Object.keys(COLOR_CODES).slice(0, 20);
  const colorHexMap: Record<string, string> = {
    '白': '#ffffff', '白色': '#ffffff', '黑': '#000000', '黑色': '#000000',
    '红': '#ff0000', '红色': '#dc2626', '蓝': '#0000ff', '蓝色': '#2563eb',
    '绿': '#00ff00', '绿色': '#16a34a', '黄': '#ffff00', '黄色': '#eab308',
    '粉': '#ffc0cb', '粉色': '#ec4899', '紫': '#800080', '紫色': '#9333ea'
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-4">SKU生成器</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">店铺前缀</label>
          <input type="text" className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]" value={prefixVal} onChange={(e) => setPrefix(e.target.value.toUpperCase())} maxLength={4} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">序列号</label>
          <input type="number" className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]" value={sequence} onChange={(e) => setSequence(parseInt(e.target.value) || 1)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">性别</label>
          <select className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]" value={gender} onChange={(e) => handleGenderChange(e.target.value)}>
            <option value="男装">男装</option>
            <option value="女装">女装</option>
            <option value="童装">童装</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">款式</label>
          <select className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]" value={side} onChange={(e) => setSide(e.target.value as 'P' | 'R' | 'PR')}>
            <option value="P">正面</option>
            <option value="R">反面</option>
            <option value="PR">正反面</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="rounded" checked={isSingleColor} onChange={(e) => setIsSingleColor(e.target.checked)} />
          <span className="text-sm">单色款式（生成白色钩子）</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="rounded" checked={hasPrint} onChange={(e) => setHasPrint(e.target.checked)} />
          <span className="text-sm">印花款式</span>
        </label>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">颜色 ({colors.length})</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {colors.map((color) => (
            <span key={color} className="px-3 py-1 rounded-full text-sm bg-[var(--color-muted)] flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colorHexMap[color] || '#cccccc' }} />
              {color}
              <button className="ml-1 text-muted hover:text-red-500" onClick={() => setColors(colors.filter(c => c !== color))}>x</button>
            </span>
          ))}
        </div>
        <select className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm" onChange={(e) => { if (e.target.value && !colors.includes(e.target.value)) setColors([...colors, e.target.value]); e.target.value = ''; }}>
          <option value="">+ 添加颜色</option>
          {colorOptions.filter(c => !colors.includes(c)).map((color) => (<option key={color} value={color}>{color}</option>))}
        </select>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">尺码 ({sizes.length})</label>
        <div className="flex flex-wrap gap-2">
          {SIZE_CODES.map((size) => (
            <label key={size} className={`px-4 py-2 rounded-lg cursor-pointer ${sizes.includes(size) ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-muted)]'}`}>
              <input type="checkbox" className="sr-only" checked={sizes.includes(size)} onChange={(e) => { if (e.target.checked) setSizes([...sizes, size]); else setSizes(sizes.filter(s => s !== size)); }} />
              {size}
            </label>
          ))}
        </div>
      </div>
      <Button className="w-full" onClick={handleGenerate}>生成SKU矩阵</Button>
      {generatedMatrix && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">生成结果 ({generatedMatrix.totalSkus}个SKU)</h4>
            {generatedMatrix.hasWhiteHook && <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-600">含白色钩子</span>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {generatedMatrix.skus.map((sku) => (
              <div key={sku.skuCode} className={`p-2 rounded-lg border text-xs ${sku.printSuffix ? 'bg-purple-50 border-purple-200' : 'bg-[var(--color-surface)] border-[var(--color-border)]'}`}>
                <p className="font-mono font-medium truncate">{sku.skuCode}</p>
                <p className="text-muted mt-1">{sku.color} / {sku.size}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
export default SkuGenerator;
