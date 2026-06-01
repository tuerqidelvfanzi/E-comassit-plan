import { useEffect, useState } from 'react';
import { Button, Card } from './ui';
import { DEFAULT_CUSTOM_CSS, type ThemeId, THEME_OPTIONS, THEME_CATEGORIES, useTheme } from '../lib/theme';

export function ThemeSettings() {
  const { theme, setTheme, customCss, applyCustomCss, resetCustomCss } = useTheme();
  const [draftCss, setDraftCss] = useState(customCss);
  const [msg, setMsg] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    setDraftCss(customCss);
  }, [customCss]);

  function onApplyCustom() {
    applyCustomCss(draftCss);
    setMsg('已应用自定义 CSS');
  }

  const currentTheme = THEME_OPTIONS.find(t => t.id === theme);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* 下拉选择器 */}
      <div>
        <label className="block text-sm font-medium mb-2">选择主题</label>
        <select
          value={theme}
          onChange={(e) => {
            const id = e.target.value as ThemeId;
            setTheme(id);
            setShowCustom(id === 'custom');
            setMsg(id === 'custom' ? '' : `已切换至「${THEME_OPTIONS.find(t => t.id === id)?.label}」`);
          }}
          className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] cursor-pointer transition hover:border-[var(--color-primary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
        >
          {THEME_CATEGORIES.map(cat => (
            <optgroup key={cat.id} label={cat.label}>
              {THEME_OPTIONS.filter(t => t.category === cat.id).map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label} {opt.id === theme ? '✓' : ''}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {msg && <p className="mt-2 text-sm text-[var(--color-primary)]">{msg}</p>}
      </div>

      {/* 快速切换按钮 */}
      <div className="flex flex-wrap gap-2">
        {THEME_OPTIONS.filter(t => t.id !== 'custom').slice(0, 6).map(opt => (
          <button
            key={opt.id}
            onClick={() => {
              setTheme(opt.id);
              setShowCustom(false);
              setMsg(`已切换至「${opt.label}」`);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              theme === opt.id
                ? 'bg-[var(--color-primary)] text-white shadow-md'
                : 'bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            theme === 'custom'
              ? 'bg-[var(--color-primary)] text-white shadow-md'
              : 'bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)]'
          }`}
        >
          自定义 CSS
        </button>
      </div>

      {/* 自定义CSS编辑器 */}
      {showCustom && (
        <Card>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="font-medium">自定义 CSS</h3>
              <p className="mt-0.5 text-xs text-muted">
                覆盖 <code className="text-label">:root[data-theme='custom']</code> 中的变量
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setDraftCss(DEFAULT_CUSTOM_CSS)}>
                恢复模板
              </Button>
              <Button size="sm" onClick={onApplyCustom}>
                应用
              </Button>
            </div>
          </div>
          <textarea
            className="w-full h-64 resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 font-mono text-xs leading-relaxed text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
            spellCheck={false}
            value={draftCss}
            onChange={(e) => setDraftCss(e.target.value)}
            aria-label="自定义主题 CSS"
          />
          <div className="mt-2 flex gap-4 text-xs text-muted">
            <button type="button" className="underline" onClick={() => resetCustomCss()}>
              重置
            </button>
            <span>当前: {currentTheme?.label}</span>
          </div>
        </Card>
      )}

      {/* 主题列表 */}
      <div className="text-xs text-muted">
        共 {THEME_OPTIONS.filter(t => t.id !== 'custom').length} 种预设主题
      </div>
    </div>
  );
}
