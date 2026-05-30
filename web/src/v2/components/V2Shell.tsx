import type { ReactNode } from 'react';
import { MockBadge } from './MockBadge';

export function V2Shell({
  title,
  desc,
  milestone,
  children,
  actions,
}: {
  title: string;
  desc?: string;
  milestone?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-[var(--color-text)]">{title}</h1>
            <MockBadge />
            {milestone ? (
              <span className="text-xs text-muted">里程碑 {milestone}</span>
            ) : null}
          </div>
          {desc ? <p className="mt-1 text-sm text-muted">{desc}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}
