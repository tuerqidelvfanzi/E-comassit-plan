import { Link } from 'react-router-dom';
import { PageHeader, Card, Badge, Button } from '../components/ui';
import { mockMetrics, mockProducts } from '../lib/mock';

export function DashboardPage() {
  const raw = mockMetrics.rawCount;
  const ready = mockMetrics.readyCount;
  const processing = mockMetrics.processingCount;
  const published = mockMetrics.publishedCount;

  return (
    <>
      <PageHeader title="工作台" desc="今日采集与处理概览（原型数据）" />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">待处理采集</p>
          <p className="mt-2 text-3xl font-semibold">{raw}</p>
          <Link to="/app/inbox" className="mt-3 inline-block text-sm text-[var(--color-primary)]">
            进入采集箱 →
          </Link>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">可发布商品</p>
          <p className="mt-2 text-3xl font-semibold">{ready}</p>
          <Link to="/app/publish" className="mt-3 inline-block text-sm text-[var(--color-primary)]">
            发布中心 →
          </Link>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">当前聚焦类目</p>
          <p className="mt-2 text-xl font-semibold">童装</p>
          <Badge tone="ok">累积模板策略</Badge>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">处理中</p>
          <p className="mt-2 text-2xl font-semibold">{processing}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">已发布</p>
          <p className="mt-2 text-2xl font-semibold">{published}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">测试数据总量</p>
          <p className="mt-2 text-2xl font-semibold">{mockProducts.length}</p>
        </Card>
      </div>
      <Card className="mt-6">
        <h2 className="font-medium">快捷操作</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline">粘贴链接采集</Button>
          <Link to="/app/templates">
            <Button variant="outline">编辑童装模板</Button>
          </Link>
          <Link to="/app/insights">
            <Button variant="outline">竞品 TOP10 分析</Button>
          </Link>
        </div>
      </Card>
    </>
  );
}
