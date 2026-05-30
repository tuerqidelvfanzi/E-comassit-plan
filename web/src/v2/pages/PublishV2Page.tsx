import { Card, Button } from '../../components/ui';
import { V2Shell } from '../components/V2Shell';
import { StatusChip } from '../components/StatusChip';
import { useSimulatePublishFill, useV2PublishTasks } from '../hooks/useV2Queries';

const statusHelp: Record<string, string> = {
  draft: '草稿',
  pending: '待发布',
  filling: '填表中',
  completed: '已完成',
  failed: '失败',
};

export function PublishV2Page() {
  const { data: tasks = [], refetch } = useV2PublishTasks();
  const simulate = useSimulatePublishFill();

  return (
    <V2Shell
      title="发布中心"
      desc="发布任务队列与 Mock DOM 填表模拟（draft → pending → filling → completed）"
      milestone="v2.0"
    >
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-muted">
                <th className="py-2">商品</th>
                <th className="py-2">平台</th>
                <th className="py-2">市场</th>
                <th className="py-2">状态</th>
                <th className="py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-b border-[var(--color-border)]">
                  <td className="py-3">{t.title}</td>
                  <td className="py-3">{t.platform}</td>
                  <td className="py-3">{t.locale}</td>
                  <td className="py-3">
                    <StatusChip status={t.status} />
                    <span className="ml-2 text-xs text-muted">{statusHelp[t.status]}</span>
                    {t.reason ? (
                      <p className="mt-1 text-xs text-red-600">{t.reason}</p>
                    ) : null}
                  </td>
                  <td className="py-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={simulate.isPending || t.status === 'completed'}
                      onClick={() =>
                        simulate.mutate(t.id, { onSuccess: () => refetch() })
                      }
                    >
                      模拟填表
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {simulate.data?.log ? (
          <p className="mt-3 rounded-lg bg-[var(--color-muted)] p-2 font-mono text-xs">
            {simulate.data.log}
          </p>
        ) : null}
      </Card>
    </V2Shell>
  );
}
