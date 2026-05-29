import { useEffect, useState } from 'react';
import { Button, Card } from './ui';
import { DEFAULT_CUSTOM_CSS, type ThemeId, useTheme } from '../lib/theme';

export function ThemeSettings() {
  const { theme, setTheme, options, customCss, applyCustomCss, resetCustomCss } = useTheme();
  const [draftCss, setDraftCss] = useState(customCss);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setDraftCss(customCss);
  }, [customCss]);

  function onApplyCustom() {
    applyCustomCss(draftCss);
    setMsg('已应用自定义 CSS，并切换为「自定义」主题。');
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((opt) => (
          <label
            key={opt.id}
            className={`cursor-pointer rounded-lg border px-4 py-3 transition ${
              theme === opt.id
                ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-focus-ring)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
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
            <p className="text-sm font-medium">{opt.label}</p>
            <p className="mt-1 text-xs text-muted">{opt.description}</p>
          </label>
        ))}
      </div>

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
