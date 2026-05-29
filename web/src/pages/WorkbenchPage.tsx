import { useParams } from 'react-router-dom';
import { PageHeader, Card, Badge, Button, Input } from '../components/ui';
import { mockProducts } from '../lib/mock';
import { mergeInboxWithMock } from '../lib/inboxStore';

export function WorkbenchPage() {
  const { id } = useParams();
  const all = mergeInboxWithMock(mockProducts);
  const product = all.find((p) => p.id === id) ?? all[0];

  return (
    <>
      <PageHeader title="处理工作台" desc={`商品 ID: ${product.id}`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-medium">原始数据（A/C 站）</h2>
          <p className="mt-2 text-sm text-label">{product.title}</p>
          <p className="mt-1 text-sm">进价 ¥{product.priceCny} · 来源 {product.source}</p>
          {'extractLayer' in product && product.extractLayer ? (
            <p className="mt-1 text-xs text-muted">
              采集层 {product.extractLayer}
              {'extractMethod' in product && product.extractMethod
                ? ` · ${product.extractMethod}`
                : ''}
            </p>
          ) : null}
          <p className="mt-1 text-sm text-muted">目标语言：{product.targetLocale}</p>
          <a href={product.sourceUrl} className="mt-2 inline-block text-sm text-[var(--color-primary)]">
            查看源链接
          </a>
          {'images' in product && product.images && product.images.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {product.images.slice(0, 6).map((url) => (
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="h-14 w-14 rounded border border-[var(--color-border)] object-cover"
                />
              ))}
            </div>
          ) : null}
        </Card>
        <Card>
          <h2 className="font-medium">处理管线</h2>
          <ol className="mt-3 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Badge tone="ok">1</Badge> 规则：VN 价 = CNY × 3500 × 2.5
            </li>
            <li className="flex items-center gap-2">
              <Badge tone="ok">2</Badge> 规则：标题 ≤ 20 字
            </li>
            <li className="flex items-center gap-2">
              <Badge>3</Badge> 模板：童装标题优化 Prompt
            </li>
            <li className="flex items-center gap-2">
              <Badge>4</Badge> LLM：翻译越南语
            </li>
          </ol>
          <label className="mt-4 block text-sm">
            <span className="text-label">临时提示词（本商品）</span>
            <Input className="mt-1" placeholder="例如：突出纯棉、适合 3-6 岁" />
          </label>
          <div className="mt-4 flex gap-2">
            <Button>运行管线</Button>
            <Button variant="outline">对比高曝光 / 高转化</Button>
          </div>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-medium text-muted">输出预览 · 高曝光</h3>
          <p className="mt-2 font-medium">váy công chúa bé gái mùa hè</p>
          <p className="mt-1 text-sm text-label">售价：₫498,750</p>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-muted">输出预览 · 高转化</h3>
          <p className="mt-2 font-medium">đầm bé gái cotton cao cấp</p>
          <p className="mt-1 text-sm text-label">售价：₫498,750</p>
        </Card>
      </div>
    </>
  );
}
