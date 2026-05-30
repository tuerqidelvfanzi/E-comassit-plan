import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, Card, Badge, Button, Input } from '../components/ui';
import { api } from '../lib/api';
import { resolveApiMode } from '../lib/api';

export function BatchCollectPage() {
  const qc = useQueryClient();
  const [listUrl, setListUrl] = useState('https://s.taobao.com/search?q=童装');
  const [maxItems, setMaxItems] = useState(10);
  const [useCookies, setUseCookies] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  const { data: jobs = [], refetch } = useQuery({
    queryKey: ['batchJobs'],
    queryFn: () => api.listBatchCollect(),
    refetchInterval: (q) => {
      const running = q.state.data?.some((j) => j.status === 'running' || j.status === 'queued');
      return running ? 2000 : false;
    },
  });

  const { data: cookieJars = [] } = useQuery({
    queryKey: ['cookieJars'],
    queryFn: () => api.getCookieJars(),
  });

  const createMut = useMutation({
    mutationFn: () =>
      api.createBatchCollect({
        listUrl,
        maxItems,
        delayMsMin: 250,
        delayMsMax: 2400,
        useCookies,
        requireUserConfirm: true,
        startImmediately: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['batchJobs'] });
      setConfirmed(false);
    },
  });

  useEffect(() => {
    const id = setInterval(() => refetch(), 3000);
    return () => clearInterval(id);
  }, [refetch]);

  return (
    <>
      <PageHeader
        title="批量采集 TOP10"
        desc="Crawlee Worker：榜单/搜索页 → 随机延迟 250–2400ms → 详情入库（需部署 API Worker）"
        action={
          <Link to="/app/inbox">
            <Button variant="outline">采集箱</Button>
          </Link>
        }
      />
      <Card className="mb-4">
        <p className="text-sm text-muted">
          模式：<strong>{resolveApiMode() === 'http' ? 'API + Playwright Worker' : '本地模拟'}</strong>
          {cookieJars.length > 0 ? (
            <span className="ml-2">
              · 已同步 Cookie：{cookieJars.map((c) => c.domain).join(', ')}
            </span>
          ) : (
            <span className="ml-2 text-[var(--color-warn-fg)]">
              · 请用插件「同步 Cookie」后再勾选使用 Cookie
            </span>
          )}
        </p>
      </Card>
      <Card className="mb-4 space-y-4">
        <label className="block text-sm">
          <span className="text-label">榜单 / 搜索列表 URL</span>
          <Input
            className="mt-1"
            value={listUrl}
            onChange={(e) => setListUrl(e.target.value)}
            placeholder="https://s.taobao.com/search?..."
          />
        </label>
        <label className="block text-sm">
          <span className="text-label">最多采集条数（≤20）</span>
          <Input
            className="mt-1 w-24"
            type="number"
            min={1}
            max={20}
            value={maxItems}
            onChange={(e) => setMaxItems(Number(e.target.value))}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={useCookies} onChange={(e) => setUseCookies(e.target.checked)} />
          使用已同步的 Cookie（插件 → 设置/Popup 同步）
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
          我确认在 B 站发起批量采集，并遵守平台规则与限速
        </label>
        <Button
          disabled={!confirmed || createMut.isPending || !listUrl}
          onClick={() => createMut.mutate()}
        >
          {createMut.isPending ? '创建中…' : '开始批量采集'}
        </Button>
      </Card>
      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-table-head text-muted">
            <tr>
              <th className="p-3">任务</th>
              <th className="p-3">状态</th>
              <th className="p-3">进度</th>
              <th className="p-3">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-b">
                <td className="p-3 max-w-xs truncate" title={j.listUrl}>
                  {j.listUrl}
                </td>
                <td className="p-3">
                  <Badge tone={j.status === 'done' ? 'ok' : j.status === 'failed' ? 'warn' : 'default'}>
                    {j.status}
                    {j.error ? ` (${j.error})` : ''}
                  </Badge>
                </td>
                <td className="p-3">
                  {j.itemsDone}/{j.maxItems} 成功 · 失败 {j.itemsFailed}
                </td>
                <td className="p-3 text-muted">{new Date(j.createdAt).toLocaleString('zh-CN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {jobs.length === 0 ? <p className="p-4 text-sm text-muted">暂无批量任务</p> : null}
      </Card>
    </>
  );
}
