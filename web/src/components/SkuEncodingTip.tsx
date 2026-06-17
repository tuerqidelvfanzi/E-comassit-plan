import { useState } from 'react';
import {
  getSkuEncodingHint,
  marketFromTemplateLanguage,
} from '../lib/skuEncodingHints';
import type { CategoryTemplateId } from '../lib/api/types';

type Props = {
  categoryId?: CategoryTemplateId;
  language?: string;
  label?: string;
};

/** 鼠标悬停显示 SKU 编码建议（演示类目） */
export function SkuEncodingTip({ categoryId = 'tpl-other', language = '中文/越南语', label = '编码建议' }: Props) {
  const [open, setOpen] = useState(false);
  const market = marketFromTemplateLanguage(language);
  const hint = getSkuEncodingHint(categoryId, market);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="text-xs font-medium text-[var(--color-primary)] underline decoration-dotted"
        aria-label={label}
      >
        {label} ⓘ
      </button>
      {open ? (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-80 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left shadow-lg"
          role="tooltip"
        >
          <p className="text-xs font-semibold text-[var(--color-primary)]">{hint.format}</p>
          <p className="mt-1 font-mono text-xs text-label">例：{hint.example}</p>
          <ul className="mt-2 list-disc pl-4 text-xs text-muted space-y-1">
            {hint.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </span>
  );
}
