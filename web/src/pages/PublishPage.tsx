import { Link } from 'react-router-dom';
import { PageHeader, Card, Badge, Button } from '../components/ui';
import { mockPublishTasks } from '../lib/mock';

export function PublishPage() {
  return (
    <>
      <PageHeader
        title="发布中心"
        desc="步骤 4–5：插件写入各平台草稿箱 → 在目标卖家中心正式发布"
        action={<Button>新建发布任务</Button>}
      />
      <Card className="mb-4">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>在本站确认商品已处理完成（状态「可发布」）</li>
          <li>打开 Shopee / TikTok Shop / 淘宝卖家中心的新建商品或草稿页</li>
          <li>点击浏览器插件，选择平台后「填入当前后台页」</li>
          <li>在目标网站检查草稿并点击平台内的「发布」按钮上架</li>
        </ol>
        <p className="mt-3 text-xs text-muted">
          演示版填入草稿为模拟提示；正式版将自动填表并回传状态。
        </p>
      </Card>
      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-table-head text-muted">
            <tr>
              <th className="p-3">平台</th>
              <th className="p-3">商品</th>
              <th className="p-3">状态</th>
              <th className="p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {mockPublishTasks.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="p-3">{t.platform}</td>
                <td className="p-3">{t.title}</td>
                <td className="p-3">
                  <Badge tone={t.status === 'completed' ? 'ok' : 'warn'}>
                    {t.status === 'completed' ? '草稿已填入' : t.status === 'failed' ? '失败待重试' : '待插件填入草稿'}
                  </Badge>
                  {t.reason ? <p className="mt-1 text-xs text-danger">{t.reason}</p> : null}
                </td>
                <td className="p-3">
                  <Button variant="outline">打开卖家后台</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-4 text-sm text-muted">
        上一步：
        <Link to="/app/inbox" className="text-[var(--color-primary)]">
          采集箱编辑
        </Link>
      </p>
    </>
  );
}
