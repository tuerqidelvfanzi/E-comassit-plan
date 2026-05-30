import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '../../components/ui';
import { V2Shell } from '../components/V2Shell';
import { useV2Overview } from '../hooks/useV2Queries';
import { useMetrics } from '../../hooks/useAppQueries';

export function DashboardV2Page() {
  const { data: overview } = useV2Overview();
  const { data: metrics } = useMetrics();

  const m = overview?.metrics;
  const cards = [
    { label: '采集商品', value: metrics?.totalProducts ?? m?.totalProducts ?? 0 },
    { label: '竞品报告', value: m?.competitorJobsDone ?? 0 },
    { label: '直采完成', value: m?.linkCollectDone ?? 0 },
    { label: '发布成功', value: m?.publishCompleted ?? 0 },
  ];

  return (
    <V2Shell
      title="工作台"
      desc="v2.0–v2.3 全功能演示（采集 → 处理 → 发布），数据均为 Mock API"
      milestone="v2.0"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-2 text-3xl font-semibold">{c.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="font-medium">推荐流程</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>
            <Link to="/app/competitors" className="text-[var(--color-primary)]">
              竞品分析
            </Link>
            ：在源平台找爆款关键词与价格带
          </li>
          <li>
            <Link to="/app/inbox" className="text-[var(--color-primary)]">
              采集箱
            </Link>
            /{' '}
            <Link to="/app/link-collect" className="text-[var(--color-primary)]">
              链接直采
            </Link>
            ：入库原始商品
          </li>
          <li>处理工作台：选模板 → 运行 Mock 管线 → 双指标预览</li>
          <li>
            <Link to="/app/publish" className="text-[var(--color-primary)]">
              发布中心
            </Link>
            ：模拟填表与状态跟踪
          </li>
        </ol>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">v2 能力清单</h2>
        <div className="flex flex-wrap gap-2">
          {overview?.features.map((f) => (
            <Badge key={f.id} tone={f.ready ? 'ok' : 'warn'}>
              {f.label} · {f.milestone}
            </Badge>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link to="/app/competitors">
          <Button type="button">开始竞品分析</Button>
        </Link>
        <Link to="/app/inbox">
          <Button type="button" variant="outline">
            打开采集箱
          </Button>
        </Link>
        <Link to="/app/settings">
          <Button type="button" variant="ghost">
            插件与模型设置
          </Button>
        </Link>
      </div>
    </V2Shell>
  );
}
