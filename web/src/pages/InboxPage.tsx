import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader, Card, Badge, Button } from '../components/ui';
import { decodeDemoImport } from '../lib/inboxStore';
import { exportProductsCsv, exportProductsJson } from '../lib/exportUtils';
import {
  useDeleteProduct,
  useInvalidateProducts,
  useProducts,
  useRunPipeline,
} from '../hooks/useAppQueries';
import type { ProductStatus } from '../lib/api/types';
const statusLabel: Record<ProductStatus, string> = {
  raw: '待处理',
  processing: '处理中',
  ready: '可发布',
  published: '已发布',
};

export function InboxPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [importMsg, setImportMsg] = useState('');
  const [filter, setFilter] = useState<ProductStatus | 'all'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const invalidate = useInvalidateProducts();
  const { data: products = [], isLoading } = useProducts(filter);
  const deleteMut = useDeleteProduct();
  const pipelineMut = useRunPipeline();

  useEffect(() => {
    const payload = searchParams.get('demoImport');
    if (!payload) return;
    const item = decodeDemoImport(payload);
    if (item) {
      invalidate();
      setImportMsg(`已从插件导入：${item.title}`);
    } else {
      setImportMsg('导入失败，请重新上传。');
    }
    searchParams.delete('demoImport');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams, invalidate]);

  const extensionCount = products.filter((p) => p.fromExtension).length;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const batchProcess = async () => {
    const ids =
      selected.size > 0 ? [...selected] : products.filter((p) => p.status === 'raw').map((p) => p.id);
    if (ids.length === 0) {
      alert('没有可处理的商品');
      return;
    }
    for (const id of ids) {
      await pipelineMut.mutateAsync({ productId: id });
    }
    setImportMsg(`已批量处理 ${ids.length} 条`);
    setSelected(new Set());
  };

  return (
    <>
      <PageHeader
        title="采集箱"
        desc="插件采集 / 链接采集 → 编辑 → 运行管线"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={pipelineMut.isPending} onClick={batchProcess}>
              {pipelineMut.isPending ? '处理中…' : '批量处理'}
            </Button>
            <Button variant="outline" onClick={() => exportProductsJson(products)}>
              导出 JSON
            </Button>
            <Button variant="outline" onClick={() => exportProductsCsv(products)}>
              导出 CSV
            </Button>
          </div>
        }
      />
      {importMsg ? (
        <Card className="mb-4 border-[var(--color-primary)]">
          <p className="text-sm text-[var(--color-primary)]">{importMsg}</p>
        </Card>
      ) : null}
      <Card className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          插件采集 <strong>{extensionCount}</strong> 条 · 共 <strong>{products.length}</strong> 条
        </p>
        <div className="flex flex-wrap gap-2 text-sm">
          {(['all', 'raw', 'processing', 'ready', 'published'] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`rounded px-2 py-1 ${filter === s ? 'bg-[var(--color-primary)] text-white' : 'bg-muted text-label'}`}
              onClick={() => setFilter(s)}
            >
              {s === 'all' ? '全部' : statusLabel[s]}
            </button>
          ))}
        </div>
      </Card>
      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-muted">加载中…</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-table-head text-muted">
              <tr>
                <th className="w-8 p-3" />
                <th className="p-3">商品</th>
                <th className="p-3">来源</th>
                <th className="p-3">进价</th>
                <th className="p-3">状态</th>
                <th className="p-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={p.thumb} alt="" className="h-10 w-10 rounded object-cover" />
                      <div>
                        <span className="line-clamp-1 max-w-xs font-medium">{p.title}</span>
                        {p.fromExtension ? (
                          <span className="text-xs text-[var(--color-primary)]">插件</span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{p.source}</td>
                  <td className="p-3">¥{p.priceCny}</td>
                  <td className="p-3">
                    <Badge tone={p.status === 'ready' ? 'ok' : p.status === 'processing' ? 'warn' : 'default'}>
                      {statusLabel[p.status]}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link to={`/app/workbench/${p.id}`}>
                        <Button variant="outline">编辑</Button>
                      </Link>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (confirm('删除？')) deleteMut.mutate(p.id);
                        }}
                      >
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
