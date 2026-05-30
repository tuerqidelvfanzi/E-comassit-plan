import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '../../components/ui';
import { V2Shell } from '../components/V2Shell';
import { RequirementModuleGrid } from '../components/RequirementModuleGrid';
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
      desc="REQUIREMENTS_V2 全量演示：采集 → 处理 → 发布；侧栏与下方模块卡可逐一点开验收"
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
        <h2 className="font-medium">推荐演示路径（8 分钟主线）</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>
            <Link to="/app/competitors" className="text-[var(--color-primary)]">
              竞品分析
            </Link>
            →{' '}
            <Link to="/app/insights" className="text-[var(--color-primary)]">
              选品洞察
            </Link>
            （可选）
          </li>
          <li>
            <Link to="/app/link-collect" className="text-[var(--color-primary)]">
              链接直采
            </Link>
            或插件采集 →{' '}
            <Link to="/app/inbox" className="text-[var(--color-primary)]">
              采集箱
            </Link>
          </li>
          <li>
            <Link to="/app/workbench/p1" className="text-[var(--color-primary)]">
              处理工作台
            </Link>
            ：模板 + 管线 + 五段 SKU + 9 图
          </li>
          <li>
            <Link to="/app/publish" className="text-[var(--color-primary)]">
              发布中心
            </Link>
            ：生成填表 → 插件写入 Shopee
          </li>
          <li>
            <Link to="/app/title-optimization" className="text-[var(--color-primary)]">
              天猫标题优化
            </Link>
            （国内源站运营单独演示）
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

      <div>
        <h2 className="mb-3 text-lg font-medium">全部功能模块（点击验收 UI）</h2>
        <RequirementModuleGrid />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/app/inbox">
          <Button type="button">采集箱</Button>
        </Link>
        <Link to="/app/title-optimization">
          <Button type="button" variant="outline">
            标题优化
          </Button>
        </Link>
        <Link to="/app/settings">
          <Button type="button" variant="ghost">
            设置与插件
          </Button>
        </Link>
      </div>
    </V2Shell>
  );
}
