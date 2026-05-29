import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader, Card, Badge, Button } from '../components/ui';
import { mockProducts } from '../lib/mock';
import {
  decodeDemoImport,
  getDemoInboxItems,
  mergeInboxWithMock,
  subscribeInbox,
} from '../lib/inboxStore';

const statusLabel = { raw: '待处理', processing: '处理中', ready: '可发布', published: '已发布' };

export function InboxPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tick, setTick] = useState(0);
  const [importMsg, setImportMsg] = useState('');

  useEffect(() => subscribeInbox(() => setTick((n) => n + 1)), []);

  useEffect(() => {
    const payload = searchParams.get('demoImport');
    if (!payload) return;
    const item = decodeDemoImport(payload);
    if (item) {
      setImportMsg(`已从插件导入：${item.title}`);
      setTick((n) => n + 1);
    } else {
      setImportMsg('导入失败，请重新在插件中点击「上传到采集箱」。');
    }
    searchParams.delete('demoImport');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const products = useMemo(() => mergeInboxWithMock(mockProducts), [tick]);
  const extensionCount = getDemoInboxItems().length;

  return (
    <>
      <PageHeader
        title="采集箱"
        desc="步骤 3：插件采集的商品在此编辑；演示版支持从插件一键导入"
        action={<Button variant="outline">批量处理</Button>}
      />
      {importMsg ? (
        <Card className="mb-4 border-[var(--color-primary)]">
          <p className="text-sm text-[var(--color-primary)]">{importMsg}</p>
        </Card>
      ) : null}
      <Card className="mb-4">
        <p className="text-sm text-muted">
          插件采集条目（演示）：<strong className="text-[var(--color-text)]">{extensionCount}</strong> 条
          · 尚未安装插件？请前往
          <Link to="/app/settings" className="mx-1 text-[var(--color-primary)]">
            设置 → 下载插件
          </Link>
        </p>
      </Card>
      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-table-head text-muted">
            <tr>
              <th className="p-3">商品</th>
              <th className="p-3">来源</th>
              <th className="p-3">类目</th>
              <th className="p-3">进价</th>
              <th className="p-3">状态</th>
              <th className="p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img src={p.thumb} alt="" className="h-10 w-10 rounded object-cover" />
                    <div>
                      <span className="line-clamp-1 max-w-xs font-medium">{p.title}</span>
                      {p.fromExtension ? (
                        <span className="text-xs text-[var(--color-primary)]">插件导入</span>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="p-3">{p.source}</td>
                <td className="p-3">{p.category}</td>
                <td className="p-3">¥{p.priceCny}</td>
                <td className="p-3">
                  <Badge tone={p.status === 'ready' ? 'ok' : p.status === 'processing' ? 'warn' : 'default'}>
                    {statusLabel[p.status]}
                  </Badge>
                </td>
                <td className="p-3">
                  <Link to={`/app/workbench/${p.id}`}>
                    <Button variant="outline">编辑</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
