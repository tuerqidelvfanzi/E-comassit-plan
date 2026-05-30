import { Link } from 'react-router-dom';
import { Card, Badge } from '../../components/ui';
import { REQUIREMENT_MODULES } from '../config/requirementModules';

const layerTone: Record<string, 'default' | 'ok' | 'warn'> = {
  选品: 'ok',
  采集: 'default',
  处理: 'warn',
  配置: 'default',
  发布: 'ok',
  系统: 'default',
};

export function RequirementModuleGrid({ filterLayer }: { filterLayer?: string }) {
  const items = filterLayer
    ? REQUIREMENT_MODULES.filter((m) => m.layer === filterLayer)
    : REQUIREMENT_MODULES;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((m) => (
        <Link key={m.id} to={m.route} className="block no-underline">
          <Card className="h-full transition hover:border-[var(--color-primary)]">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-[var(--color-fg)]">{m.title}</h3>
              <Badge tone={layerTone[m.layer] ?? 'default'}>{m.layer}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted">{m.requirement}</p>
            <p className="mt-2 text-xs text-[var(--color-primary)]">进入页面 →</p>
            <p className="mt-1 text-xs text-muted">{m.milestone}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
