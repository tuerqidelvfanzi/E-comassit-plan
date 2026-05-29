import { PageHeader, Card, Badge, Button } from '../components/ui';
import { mockPublishTasks } from '../lib/mock';

export function PublishPage() {
  return (
    <>
      <PageHeader title="发布中心" desc="由插件写入各平台草稿箱" action={<Button>新建发布任务</Button>} />
      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
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
                    {t.status === 'completed' ? '已完成' : t.status === 'failed' ? '失败待重试' : '待插件填入'}
                  </Badge>
                  {t.reason ? <p className="mt-1 text-xs text-red-500">{t.reason}</p> : null}
                </td>
                <td className="p-3">
                  <Button variant="outline">打开卖家后台</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
