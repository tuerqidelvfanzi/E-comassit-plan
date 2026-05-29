import { Link } from 'react-router-dom';
import { PageHeader, Card, Badge, Button } from '../components/ui';
import { mockProducts } from '../lib/mock';

const statusLabel = { raw: '待处理', processing: '处理中', ready: '可发布', published: '已发布' };

export function InboxPage() {
  return (
    <>
      <PageHeader
        title="采集箱"
        desc="插件或链接采集的商品原始数据"
        action={<Button>批量处理</Button>}
      />
      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
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
            {mockProducts.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img src={p.thumb} alt="" className="h-10 w-10 rounded object-cover" />
                    <span className="line-clamp-1 max-w-xs font-medium">{p.title}</span>
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
                    <Button variant="outline">处理</Button>
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
