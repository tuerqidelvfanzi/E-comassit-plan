import { useEffect, useState } from 'react';
import { Button, Card, Badge } from './ui';
import { DEFAULT_CUSTOM_CSS, type ThemeId, type ThemeCategory, THEME_OPTIONS, THEME_CATEGORIES, useTheme } from '../lib/theme';

export function ThemeSettings() {
  const { theme, setTheme, customCss, applyCustomCss, resetCustomCss } = useTheme();
  const [draftCss, setDraftCss] = useState(customCss);
  const [msg, setMsg] = useState('');
  const [activeCategory, setActiveCategory] = useState<ThemeCategory | 'all'>('all');

  useEffect(() => {
    setDraftCss(customCss);
  }, [customCss]);

  function onApplyCustom() {
    applyCustomCss(draftCss);
    setMsg('已应用自定义 CSS，并切换为「自定义」主题。');
  }

  const filteredThemes = activeCategory === 'all'
    ? THEME_OPTIONS
    : THEME_OPTIONS.filter(t => t.category === activeCategory);

  const categoryCount = (cat: ThemeCategory) =>
    THEME_OPTIONS.filter(t => t.category === cat).length;

  return (
    <div className="space-y-6">
      {/* 分类切换 */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeCategory === 'all'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)]'
          }`}
        >
          全部 ({THEME_OPTIONS.filter(t => t.id !== 'custom').length})
        </button>
        {THEME_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeCategory === cat.id
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)]'
            }`}
          >
            {cat.label} ({categoryCount(cat.id)})
          </button>
        ))}
      </div>

      {/* 主题网格 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredThemes.map((opt) => (
          <label
            key={opt.id}
            className={`cursor-pointer rounded-xl border-2 p-3 transition all ${
              theme === opt.id
                ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-focus-ring)] shadow-lg'
                : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-md'
            } bg-[var(--color-surface)]`}
          >
            <input
              type="radio"
              name="theme"
              className="sr-only"
              checked={theme === opt.id}
              onChange={() => {
                setTheme(opt.id as ThemeId);
                setMsg(opt.id === 'custom' ? '已选择自定义主题，可在下方编辑 CSS。' : '');
              }}
            />
            {/* 主题预览色块 */}
            <div className="flex gap-1.5 mb-3">
              <div
                className="w-6 h-6 rounded-md border border-[var(--color-border)]"
                style={{ backgroundColor: opt.preview.bg }}
                title="背景色"
              />
              <div
                className="w-6 h-6 rounded-md border border-[var(--color-border)]"
                style={{ backgroundColor: opt.preview.surface }}
                title="表面色"
              />
              <div
                className="w-6 h-6 rounded-md border border-[var(--color-border)]"
                style={{ backgroundColor: opt.preview.accent }}
                title="主强调色"
              />
              <div
                className="w-6 h-6 rounded-md border border-[var(--color-border)]"
                style={{ backgroundColor: opt.preview.accent2 }}
                title="次强调色"
              />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium">{opt.label}</p>
              <Badge tone={opt.category === 'light' ? 'default' : opt.category === 'dark' ? 'ok' : opt.category === 'tech' ? 'warn' : 'default'} className="text-[10px] px-1.5">
                {THEME_CATEGORIES.find(c => c.id === opt.category)?.label}
              </Badge>
            </div>
            {opt.labelEn && (
              <p className="text-xs text-muted mb-1">{opt.labelEn}</p>
            )}
            <p className="text-xs text-muted">{opt.description}</p>
            {theme === opt.id && (
              <div className="mt-2 flex items-center gap-1 text-xs text-[var(--color-primary)]">
                <span>✓</span> <span>当前主题</span>
              </div>
            )}
          </label>
        ))}
      </div>

      {/* 主题统计 */}
      <div className="flex flex-wrap gap-4 text-xs text-muted">
        <span>共 {THEME_OPTIONS.filter(t => t.id !== 'custom').length} 种预设主题</span>
        <span>·</span>
        <span>浅色系: {categoryCount('light')}</span>
        <span>·</span>
        <span>深色系: {categoryCount('dark')}</span>
        <span>·</span>
        <span>科技感: {categoryCount('tech')}</span>
        <span>·</span>
        <span>复古风: {categoryCount('retro')}</span>
      </div>

      {/* 自定义CSS编辑器 */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-medium">自定义 CSS</h3>
            <p className="mt-1 text-xs text-muted">
              编写 <code className="text-label">:root[data-theme=&apos;custom&apos;]</code>{' '}
              覆盖语义变量；保存于本浏览器。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" type="button" onClick={() => setDraftCss(DEFAULT_CUSTOM_CSS)}>
              恢复模板
            </Button>
            <Button type="button" onClick={onApplyCustom}>
              应用 CSS
            </Button>
          </div>
        </div>
        <textarea
          className="mt-3 min-h-[280px] w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-code-bg)] p-3 font-mono text-xs leading-relaxed text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
          spellCheck={false}
          value={draftCss}
          onChange={(e) => setDraftCss(e.target.value)}
          aria-label="自定义主题 CSS"
        />
        {msg ? <p className="mt-2 text-sm text-[var(--color-primary)]">{msg}</p> : null}
        {theme === 'custom' ? (
          <button
            type="button"
            className="mt-2 text-xs text-muted underline"
            onClick={() => resetCustomCss()}
          >
            重置为默认模板并重新应用
          </button>
        ) : null}
      </Card>
    </div>
  );
}
