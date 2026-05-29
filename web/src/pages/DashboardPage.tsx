import { Link } from 'react-router-dom';
import { PageHeader, Card, Badge, Button } from '../components/ui';
import { WorkflowGuide } from '../components/WorkflowGuide';
import { ApiModeBanner } from '../components/ApiModeBanner';
import { downloadExtensionZip } from '../lib/extension';
import { useMetrics } from '../hooks/useAppQueries';

export function DashboardPage() {
  const { data: m, isLoading } = useMetrics();

  return (
    <>
      <PageHeader
        title="工作台"
        desc="采集 → 编辑 → 草稿 → 正式发布的运营中枢"
        action={<Button onClick={downloadExtensionZip}>下载插件</Button>}
      />
      <ApiModeBanner />
      <Card className="mb-6">
        <h2 className="mb-3 font-medium">作业流程</h2>
        <WorkflowGuide />
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">待处理采集</p>
          <p className="mt-2 text-3xl font-semibold">{isLoading ? '—' : m?.rawCount ?? 0}</p>
          <Link to="/app/inbox" className="mt-3 inline-block text-sm text-[var(--color-primary)]">
            进入采集箱 →
          </Link>
        </Card>
        <Card>
          <p className="text-sm text-muted">可发布商品</p>
          <p className="mt-2 text-3xl font-semibold">{isLoading ? '—' : m?.readyCount ?? 0}</p>
          <Link to="/app/publish" className="mt-3 inline-block text-sm text-[var(--color-primary)]">
            发布中心 →
          </Link>
        </Card>
        <Card>
          <p className="text-sm text-muted">当前聚焦类目</p>
          <p className="mt-2 text-xl font-semibold">童装</p>
          <Badge tone="ok">累积模板策略</Badge>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">处理中</p>
          <p className="mt-2 text-2xl font-semibold">{isLoading ? '—' : m?.processingCount ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">已发布</p>
          <p className="mt-2 text-2xl font-semibold">{isLoading ? '—' : m?.publishedCount ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">商品总量</p>
          <p className="mt-2 text-2xl font-semibold">{isLoading ? '—' : m?.totalProducts ?? 0}</p>
        </Card>
      </div>
    </>
  );
}
