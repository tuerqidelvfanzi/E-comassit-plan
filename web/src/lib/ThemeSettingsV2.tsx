import { useState } from 'react';
import { Card, Button } from '../components/ui';
import { useThemeV2, THEME_PRESETS, type ColorScheme } from './theme-v2';

const COLOR_FIELDS: { key: keyof ColorScheme; label: string }[] = [
  { key: 'primary', label: '主色调' },
  { key: 'primaryFg', label: '主色文字' },
  { key: 'bg', label: '背景色' },
  { key: 'surface', label: '卡片色' },
  { key: 'text', label: '文字色' },
  { key: 'textMuted', label: '次要文字' },
  { key: 'border', label: '边框色' },
  { key: 'success', label: '成功色' },
  { key: 'warn', label: '警告色' },
  { key: 'danger', label: '危险色' },
];

export function ThemeSettingsV2() {
  const { preset, colorOverrides, setPreset, updateColors, resetColors } = useThemeV2();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [localOverrides, setLocalOverrides] = useState<Partial<ColorScheme>>(
    colorOverrides ?? {}
  );
  const [msg, setMsg] = useState('');

  function handlePresetChange(id: string) {
    setPreset(id);
    setLocalOverrides({});
    setMsg('已切换至' + THEME_PRESETS.find(p => p.id === id)?.name);
  }

  function handleColorChange(key: keyof ColorScheme, value: string) {
    setLocalOverrides(prev => ({ ...prev, [key]: value }));
  }

  function handleApplyColors() {
    updateColors(localOverrides);
    setMsg('配色已更新');
  }

  function handleResetColors() {
    resetColors();
    setLocalOverrides({});
    setMsg('已恢复预设配色');
  }

  const currentColors = { ...preset.colors, ...(colorOverrides ?? {}) };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-lg font-medium mb-3">选择主题风格</h3>
        <div className="grid grid-cols-2 gap-4">
          {THEME_PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => handlePresetChange(p.id)}
              className={p.id === preset.id
                ? 'p-4 rounded-xl border-2 border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-left'
                : 'p-4 rounded-xl border-2 border-[var(--color-border)] hover:border-[var(--color-primary)] text-left'}
            >
              <div className="flex gap-2 mb-3">
                <div className="w-8 h-8 rounded" style={{ backgroundColor: p.colors.primary }} />
                <div className="w-8 h-8 rounded" style={{ backgroundColor: p.colors.bg }} />
                <div className="w-8 h-8 rounded" style={{ backgroundColor: p.colors.surface }} />
                <div className="w-8 h-8 rounded" style={{ backgroundColor: p.colors.success }} />
              </div>
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">{p.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">配色微调</h3>
          <Button variant="outline" size="sm" onClick={() => setShowColorPicker(!showColorPicker)}>
            {showColorPicker ? '收起' : '展开'}
          </Button>
        </div>

        {showColorPicker && (
          <Card>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {COLOR_FIELDS.map(field => (
                <div key={field.key} className="space-y-1">
                  <label className="text-sm text-[var(--color-text-label)]">{field.label}</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={localOverrides[field.key] ?? currentColors[field.key]}
                      onChange={e => handleColorChange(field.key, e.target.value)}
                      className="w-10 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={localOverrides[field.key] ?? currentColors[field.key]}
                      onChange={e => handleColorChange(field.key, e.target.value)}
                      className="flex-1 px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface)]"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
              <Button size="sm" onClick={handleApplyColors}>应用配色</Button>
              <Button variant="outline" size="sm" onClick={handleResetColors}>恢复预设</Button>
            </div>
          </Card>
        )}
      </div>

      <div className="text-sm text-[var(--color-text-muted)]">
        {msg && <p className="text-[var(--color-primary)] mb-2">{msg}</p>}
        <p>当前主题：{preset.name} | 视觉风格：{preset.visualStyle}</p>
      </div>
    </div>
  );
}
