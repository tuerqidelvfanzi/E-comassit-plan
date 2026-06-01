/**
 * 采集箱页面
 * V3需求: FR-C-03 采集箱
 */
import { useState, useMemo } from 'react';
import { Card, Button } from '../../components/ui';

const MOCK_PRODUCTS = [
  { id: '1', source: '1688', title: '2024夏季新款可爱卡通小熊熊印花纯棉短袖T恤儿童百搭', price: 29.9, collectedAt: '2026-06-01T10:30:00Z', status: 'pending' },
  { id: '2', source: 'taobao', title: '韩版宽松bf风街头潮流字母印花短袖T恤男款', price: 59, collectedAt: '2026-06-01T09:15:00Z', status: 'processing' },
  { id: '3', source: '1688', title: '高级感气质修身显瘦吊带连衣裙女夏季新款法式优雅', price: 89, collectedAt: '2026-05-31T16:45:00Z', status: 'completed' },
  { id: '4', source: 'pinduoduo', title: '儿童防晒衣女童夏季轻薄透气沙滩服宝宝外套', price: 39.9, collectedAt: '2026-05-31T14:20:00Z', status: 'pending' }
];

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  '1688': { label: '1688', color: '#f50' },
  'taobao': { label: '淘宝', color: '#ff5000' },
  'pinduoduo': { label: '拼多多', color: '#e1251b' }
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  'pending': { label: '待处理', color: '#999' },
  'processing': { label: '处理中', color: '#0070f3' },
  'completed': { label: '已完成', color: '#0c9' },
  'failed': { label: '失败', color: '#dc2626' }
};

export function InboxPage() {
  const [products] = useState(MOCK_PRODUCTS);
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [filterSource, setFilterSource] = useState('all');

  const filtered = useMemo(() => {
    return products.filter(p => filterSource === 'all' || p.source === filterSource);
  }, [products, filterSource]);

  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const handleDelete = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">采集箱</h1>
          <p className="text-sm text-muted mt-1">共 {products.length} 件商品，已选 {selectedIds.size} 件</p>
        </div>
        <Button variant="outline">导入商品</Button>
      </div>

      <Card className="p-4 mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted">来源:</span>
          <div className="flex gap-1">
            <button
              className={`px-3 py-1 rounded text-sm ${filterSource === 'all' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-muted)]'}`}
              onClick={() => setFilterSource('all')}
            >
              全部
            </button>
            {Object.entries(SOURCE_LABELS).map(([key, { label }]) => (
              <button
                key={key}
                className={`px-3 py-1 rounded text-sm ${filterSource === key ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-muted)]'}`}
                onClick={() => setFilterSource(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="px-4 py-3 text-left w-10">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-4 py-3 text-left">商品</th>
                <th className="px-4 py-3 text-left w-24">来源</th>
                <th className="px-4 py-3 text-left w-24">价格</th>
                <th className="px-4 py-3 text-left w-24">状态</th>
                <th className="px-4 py-3 text-left w-32">时间</th>
                <th className="px-4 py-3 text-right w-32">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
                <tr key={product.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-muted)]">
                  <td className="px-4 py-3">
                    <input type="checkbox" className="rounded" checked={selectedIds.has(product.id)} onChange={(e) => handleSelect(product.id, e.target.checked)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[var(--color-muted)] flex items-center justify-center text-xs text-muted">图</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate max-w-md">{product.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: SOURCE_LABELS[product.source].color + '15', color: SOURCE_LABELS[product.source].color }}
                    >
                      {SOURCE_LABELS[product.source].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">¥{product.price}</td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: STATUS_LABELS[product.status].color + '15', color: STATUS_LABELS[product.status].color }}
                    >
                      {STATUS_LABELS[product.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{formatTime(product.collectedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline">编辑</Button>
                      <Button size="sm" variant="ghost" className="text-[var(--color-danger)]" onClick={() => handleDelete(product.id)}>删除</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default InboxPage;
