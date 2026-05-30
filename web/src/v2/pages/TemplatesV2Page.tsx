import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Button } from '../../components/ui';
import { SkuEncodingTip } from '../../components/SkuEncodingTip';
import { V2Shell } from '../components/V2Shell';
import { useTemplates } from '../../hooks/useAppQueries';
import { useV2TemplateCatalog } from '../hooks/useV2Queries';

export function TemplatesV2Page() {
  const { data: catalog = [] } = useV2TemplateCatalog();
  const { data: userTemplates = [] } = useTemplates();
  const [modeFilter, setModeFilter] = useState<'all' | 'A' | 'B' | 'C'>('all');

  const filtered = catalog.filter((t) => modeFilter === 'all' || t.mode === modeFilter);

  return (
    <V2Shell
      title="类目模板"
      desc="A/B/C 品类 SKU 模式与系统 Prompt（目录 Mock + 用户模板 API）"
      milestone="v2.0"
      actions={<SkuEncodingTip />}
    >
      <div className="flex flex-wrap gap-2">
        {(['all', 'A', 'B', 'C'] as const).map((m) => (
          <Button
            key={m}
            type="button"
            size="sm"
            variant={modeFilter === m ? 'primary' : 'outline'}
            onClick={() => setModeFilter(m)}
          >
            {m === 'all' ? '全部' : `${m} 类`}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((t) => (
          <Card key={t.id}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium">{t.name}</h3>
              <Badge tone="ok">{t.mode} 类</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">{t.description}</p>
            <p className="mt-2 font-mono text-xs">{t.skuPreview}</p>
            <p className="mt-2 text-xs text-muted">
              市场 {t.locales.join(' · ')} · {t.milestone}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="font-medium">我的模板（v1 API 持久化）</h2>
        <ul className="mt-3 divide-y divide-[var(--color-border)] text-sm">
          {userTemplates.map((t) => (
            <li key={t.id} className="flex justify-between py-2">
              <span>{t.name}</span>
              <Badge tone={t.status === 'active' ? 'ok' : 'default'}>{t.status}</Badge>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          在工作台选择模板并运行管线。编辑 SKU 配置请使用原有模板表单（设置内可跳转）。
        </p>
        <Link to="/app/workbench/p1" className="mt-2 inline-block text-sm text-[var(--color-primary)]">
          打开示例工作台 →
        </Link>
      </Card>
    </V2Shell>
  );
}
