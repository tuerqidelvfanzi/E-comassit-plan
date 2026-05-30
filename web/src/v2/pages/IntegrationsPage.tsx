import { Card, Badge } from '../../components/ui';
import { V2Shell } from '../components/V2Shell';
import { useV2OpenApi, useV2PublishAdapters } from '../hooks/useV2Queries';

export function IntegrationsPage() {
  const { data: adapters = [] } = useV2PublishAdapters();
  const { data: apis = [] } = useV2OpenApi();

  return (
    <V2Shell
      title="平台集成"
      desc="DOM 填表适配器与 Open API 连接状态（演示 Mock）"
      milestone="v2.3"
    >
      <Card>
        <h2 className="font-medium">发布适配器</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {adapters.map((a) => (
            <div
              key={a.id}
              className="rounded-lg border border-[var(--color-border)] p-3 text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {a.platform} · {a.locale}
                </span>
                <Badge tone={a.status === 'ready' ? 'ok' : 'warn'}>{a.status}</Badge>
              </div>
              <p className="mt-1 text-muted">
                模式 {a.mode} · {a.milestone}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-medium">Open API</h2>
        <ul className="mt-3 space-y-3">
          {apis.map((api) => (
            <li
              key={api.platform + api.locale}
              className="rounded-lg border border-[var(--color-border)] p-3 text-sm"
            >
              <div className="flex justify-between">
                <span className="font-medium">{api.platform}</span>
                <Badge tone={api.status === 'mock' ? 'warn' : 'default'}>{api.status}</Badge>
              </div>
              <p className="mt-1 text-muted">Scopes: {api.scopes.join(', ')}</p>
              <p className="mt-1">
                配额 {api.quotaUsed} / {api.quotaLimit}（Mock）
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </V2Shell>
  );
}
