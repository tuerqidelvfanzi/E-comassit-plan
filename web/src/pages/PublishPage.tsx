import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageHeader, Card, Badge, Button } from '../components/ui';
import { api } from '../lib/api';
import { queryKeys, useProducts, usePublishTasks } from '../hooks/useAppQueries';
import type { PublishTask } from '../lib/api/types';

const sellerUrls: Record<PublishTask['platform'], string> = {
  Shopee: 'https://seller.shopee.cn/',
  'TikTok Shop': 'https://seller.tiktokglobalshop.com/',
  淘宝: 'https://sell.taobao.com/',
};

export function PublishPage() {
  const { data: tasks = [] } = usePublishTasks();
  const { data: products = [] } = useProducts('ready');
  const qc = useQueryClient();

  const createMut = useMutation({
    mutationFn: () => {
      const p = products[0];
      if (!p) throw new Error('NO_READY_PRODUCT');
      return api.createPublishTask({
        platform: p.targetLocale === 'vi-VN' ? 'Shopee' : 'TikTok Shop',
        title: p.processed?.conversion.title ?? p.title,
        productId: p.id,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.publish }),
  });

  const patchMut = useMutation({
    mutationFn: (vars: { id: string; status: PublishTask['status'] }) =>
      api.updatePublishTask(vars.id, { status: vars.status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.publish }),
  });

  return (
    <>
      <PageHeader
        title="发布中心"
        desc="插件填入草稿 → 卖家中心正式发布"
        action={
          <Button
            disabled={createMut.isPending || products.length === 0}
            onClick={() => {
              createMut.mutate(undefined, {
                onError: () => alert('请先将商品处理为「可发布」'),
              });
            }}
          >
            新建发布任务
          </Button>
        }
      />
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
            {tasks.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="p-3">{t.platform}</td>
                <td className="p-3">{t.title}</td>
                <td className="p-3">
                  <Badge tone={t.status === 'completed' ? 'ok' : 'warn'}>{t.status}</Badge>
                </td>
                <td className="p-3 flex gap-2">
                  <Button variant="outline" onClick={() => window.open(sellerUrls[t.platform], '_blank')}>
                    打开后台
                  </Button>
                  {t.status === 'pending' ? (
                    <Button variant="outline" onClick={() => patchMut.mutate({ id: t.id, status: 'completed' })}>
                      标记已填入
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-4 text-sm">
        <Link to="/app/inbox" className="text-[var(--color-primary)]">
          采集箱
        </Link>
      </p>
    </>
  );
}
