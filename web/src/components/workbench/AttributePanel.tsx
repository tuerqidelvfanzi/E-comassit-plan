/**
 * 属性改写面板
 * V3需求: FR-RW-05 属性改写
 */
import { useState } from 'react';
import { Card, Button, Badge } from '../ui';
import { rewriteAttributes, normalizeColor, normalizeSize, normalizeFabric, validateFabricConsistency, getAttributeSuggestions } from '../../../../shared/src/attribute';

const SAMPLE_ATTRIBUTES = [
  { name: '颜色', value: '白色' },
  { name: '尺码', value: 'M' },
  { name: '面料', value: '纯棉' },
  { name: '领型', value: '圆领' },
  { name: '袖长', value: '短袖' },
];

const LOCALES = [
  { id: 'vi-VN', name: '越南语', flag: '🇻🇳' },
  { id: 'th-TH', name: '泰语', flag: '🇹🇭' },
  { id: 'fil-PH', name: '菲律宾语', flag: '🇵🇭' },
  { id: 'id-ID', name: '印尼语', flag: '🇮🇩' },
];

export function AttributePanel() {
  const [locale, setLocale] = useState('vi-VN');
  const [attributes, setAttributes] = useState<Record<string, string>>(
    Object.fromEntries(SAMPLE_ATTRIBUTES.map(a => [a.name, a.value]))
  );
  const [rewrittenAttrs, setRewrittenAttrs] = useState<Record<string, string>>({});
  const [fabricWarning, setFabricWarning] = useState<string | null>(null);

  const handleRewrite = () => {
    // 改写属性
    const rewritten = rewriteAttributes(attributes, { locale, category: '服装', platform: 'shopee' });
    const result: Record<string, string> = {};
    for (const [key, attr] of Object.entries(rewritten)) {
      result[key] = attr.normalizedValue;
    }
    setRewrittenAttrs(result);

    // 验证面料一致性
    const title = '纯棉短袖T恤'; // 模拟标题
    const validation = validateFabricConsistency(title, result);
    setFabricWarning(validation.valid ? null : validation.message);
  };

  const handleAttrChange = (name: string, value: string) => {
    setAttributes(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-medium">属性改写</h2>
          <p className="text-xs text-muted">FR-RW-05 · 颜色/尺码/面料标准化</p>
        </div>
        <Badge tone="ok">已实现</Badge>
      </div>

      {/* 目标市场选择 */}
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

      {/* 属性编辑 */}
      <div className="space-y-3 mb-4">
        {Object.entries(attributes).map(([name, value]) => (
          <div key={name} className="flex items-center gap-3">
            <span className="w-16 text-sm text-muted">{name}</span>
            <input
              type="text"
              value={value}
              onChange={(e) => handleAttrChange(name, e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm"
            />
            {rewrittenAttrs[name] && (
              <span className="text-sm text-[var(--color-success)]">→ {rewrittenAttrs[name]}</span>
            )}
          </div>
        ))}
      </div>

      {/* 面料一致性警告 */}
      {fabricWarning && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 text-sm">
          ⚠️ {fabricWarning}
        </div>
      )}

      <Button className="w-full" onClick={handleRewrite}>
        改写属性
      </Button>

      {/* 改写建议 */}
      <div className="mt-4 p-3 rounded-lg bg-[var(--color-muted)]">
        <h4 className="text-xs font-medium mb-2">改写规则</h4>
        <ul className="text-xs text-muted space-y-1">
          {getAttributeSuggestions('服装', locale).map((s, i) => (
            <li key={i}>• {s}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export default AttributePanel;
