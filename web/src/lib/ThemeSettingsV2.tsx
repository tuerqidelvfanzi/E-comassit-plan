import { useState } from 'react';
import { Card, Button } from '../components/ui';
import { useThemeV2, THEME_PRESETS, CSS_THEMES, type ColorScheme, type CssThemeEntry } from './theme-v2';

const COLOR_FIELDS: { key: keyof ColorScheme; label: string }[] = [
  { key: 'primary', label: '\u4e3b\u8272\u8c03' },
  { key: 'primaryFg', label: '\u4e3b\u8272\u6587\u5b57' },
  { key: 'bg', label: '\u80cc\u666f\u8272' },
  { key: 'surface', label: '\u5361\u7247\u8272' },
  { key: 'text', label: '\u6587\u5b57\u8272' },
  { key: 'textMuted', label: '\u6b21\u8981\u6587\u5b57' },
  { key: 'border', label: '\u8fb9\u6846\u8272' },
  { key: 'success', label: '\u6210\u529f\u8272' },
  { key: 'warn', label: '\u8b66\u544a\u8272' },
  { key: 'danger', label: '\u5371\u9669\u8272' },
];

const CAT_LABELS: Record<CssThemeEntry['category'], string> = {
  light: '\u6d45\u8272',
  dark: '\u6df1\u8272',
  special: '\u7279\u8272',
};

export function ThemeSettingsV2() {
  const { mode, preset, cssTheme, colorOverrides, setPreset, setCssTheme, updateColors, resetColors } = useThemeV2();
  const [tab, setTab] = useState<'preset' | 'css'>(mode === 'css' ? 'css' : 'preset');
  const [cssFilter, setCssFilter] = useState<'all' | CssThemeEntry['category']>('all');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [localOverrides, setLocalOverrides] = useState<Partial<ColorScheme>>(
    colorOverrides ?? {}
  );
  const [msg, setMsg] = useState('');

  function handlePresetChange(id: string) {
    setPreset(id);
    setLocalOverrides({});
    setTab('preset');
    setMsg('\u5df2\u5207\u6362\u81f3 ' + THEME_PRESETS.find(p => p.id === id)?.name);
  }

  function handleCssThemeChange(id: string) {
    setCssTheme(id);
    setTab('css');
    setMsg('\u5df2\u5207\u6362\u81f3 ' + CSS_THEMES.find(t => t.id === id)?.name);
  }

  function handleColorChange(key: keyof ColorScheme, value: string) {
    setLocalOverrides(prev => ({ ...prev, [key]: value }));
  }

  function handleApplyColors() {
    updateColors(localOverrides);
    setMsg('\u914d\u8272\u5df2\u66f4\u65b0');
  }

  function handleResetColors() {
    resetColors();
    setLocalOverrides({});
    setMsg('\u5df2\u6062\u590d\u9884\u8bbe\u914d\u8272');
  }

  const currentColors = { ...preset.colors, ...(colorOverrides ?? {}) };
  const filteredCssThemes = cssFilter === 'all'
    ? CSS_THEMES
    : CSS_THEMES.filter(t => t.category === cssFilter);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Tab switcher */}
      <div className="flex gap-2 border-b border-[var(--color-border)] pb-2">
        <button
          onClick={() => setTab('preset')}
          className={'px-4 py-2 rounded-t-lg text-sm font-medium transition ' +
            (tab === 'preset'
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]')}
        >
          {'\u9884\u8bbe\u98ce\u683c'} ({THEME_PRESETS.length})
        </button>
        <button
          onClick={() => setTab('css')}
          className={'px-4 py-2 rounded-t-lg text-sm font-medium transition ' +
            (tab === 'css'
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]')}
        >
          {'CSS \u4e3b\u9898'} ({CSS_THEMES.length})
        </button>
      </div>

      {/* ---- Preset tab ---- */}
      {tab === 'preset' && (
        <>
          <div>
            <h3 className="text-lg font-medium mb-3">{'\u9009\u62e9\u4e3b\u9898\u98ce\u683c'}</h3>
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

          {/* Color picker for presets */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">{'\u914d\u8272\u5fae\u8c03'}</h3>
              <Button variant="outline" size="sm" onClick={() => setShowColorPicker(!showColorPicker)}>
                {showColorPicker ? '\u6536\u8d77' : '\u5c55\u5f00'}
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
                  <Button size="sm" onClick={handleApplyColors}>{'\u5e94\u7528\u914d\u8272'}</Button>
                  <Button variant="outline" size="sm" onClick={handleResetColors}>{'\u6062\u590d\u9884\u8bbe'}</Button>
                </div>
              </Card>
            )}
          </div>
        </>
      )}

      {/* ---- CSS themes tab ---- */}
      {tab === 'css' && (
        <>
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'light', 'dark', 'special'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setCssFilter(cat)}
                className={'px-3 py-1.5 rounded-full text-xs font-medium transition ' +
                  (cssFilter === cat
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)]'
                    : 'bg-[var(--color-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]')}
              >
                {cat === 'all' ? '\u5168\u90e8' : CAT_LABELS[cat]} ({cat === 'all' ? CSS_THEMES.length : CSS_THEMES.filter(t => t.category === cat).length})
              </button>
            ))}
          </div>

          {/* CSS theme grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredCssThemes.map(t => {
              const isActive = mode === 'css' && cssTheme.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleCssThemeChange(t.id)}
                  className={'p-3 rounded-xl border-2 text-left transition-all ' +
                    (isActive
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] shadow-md'
                      : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-sm')}
                >
                  <div className="flex items-center gap-1 mb-2">
                    <span className={'px-1.5 py-0.5 rounded text-[10px] font-medium ' +
                      (t.category === 'light' ? 'bg-yellow-100 text-yellow-800' :
                       t.category === 'dark' ? 'bg-indigo-100 text-indigo-800' :
                       'bg-pink-100 text-pink-800')}>
                      {CAT_LABELS[t.category]}
                    </span>
                    {isActive && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                    )}
                  </div>
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2">
                    {t.description}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Status bar */}
      <div className="text-sm text-[var(--color-text-muted)] border-t border-[var(--color-border)] pt-3">
        {msg && <p className="text-[var(--color-success)] mb-1">{msg}</p>}
        <p>
          {'\u5f53\u524d\uff1a'}
          {mode === 'css'
            ? 'CSS \u201c' + cssTheme.name + '\u201d'
            : '\u9884\u8bbe \u201c' + preset.name + '\u201d'}
        </p>
      </div>
    </div>
  );
}
