/**
 * ThemePreview - 主题卡片预览（CSS 合成的简化页面缩略）
 */
import type { ThemePackage } from '../../types/theme-package';
import { useMemo } from 'react';

interface Props {
  theme: ThemePackage;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
}

export function ThemePreview({ theme, size = 'md', selected, onClick }: Props) {
  const cssVars = useMemo(() => {
    const v: Record<string, string> = {};
    for (const [k, val] of Object.entries(theme.colors)) {
      v['--color-' + k.replace(/([A-Z])/g, '-$1').toLowerCase()] = val;
    }
    return v as React.CSSProperties;
  }, [theme.colors]);

  const dims = {
    sm: { w: 120, h: 80 },
    md: { w: 200, h: 130 },
    lg: { w: 280, h: 180 },
  }[size];

  return (
    <div
      onClick={onClick}
      className={[
        'rounded-xl border-2 cursor-pointer transition-all overflow-hidden',
        selected
          ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary-soft)]'
          : 'border-[var(--color-border)] hover:border-[var(--color-primary)]',
      ].join(' ')}
      style={{ width: dims.w, height: dims.h, ...cssVars }}
    >
      <div
        className="h-full w-full p-2 flex flex-col gap-1"
        style={{ background: theme.colors.bg, color: theme.colors.text }}
      >
        <div
          className="rounded text-[8px] font-medium px-1.5 py-0.5"
          style={{ background: theme.colors.primary, color: theme.colors.primaryFg, width: '60%' }}
        >
          {theme.name}
        </div>
        <div className="flex gap-1 mt-1">
          <div
            className="rounded flex-1 h-4"
            style={{ background: theme.colors.surface, border: '1px solid ' + theme.colors.border }}
          />
          <div
            className="rounded flex-1 h-4"
            style={{ background: theme.colors.surface, border: '1px solid ' + theme.colors.border }}
          />
        </div>
        <div className="flex gap-1 mt-auto">
          <span
            className="rounded-full text-[6px] px-1"
            style={{ background: theme.colors.success + '20', color: theme.colors.success }}
          >
            成功
          </span>
          <span
            className="rounded-full text-[6px] px-1"
            style={{ background: theme.colors.warn + '20', color: theme.colors.warn }}
          >
            警告
          </span>
        </div>
      </div>
    </div>
  );
}
