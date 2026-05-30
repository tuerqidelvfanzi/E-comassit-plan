import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, Button, Input, Badge } from '../../components/ui';
import { V2Shell } from '../components/V2Shell';
import { useProduct, useTemplates } from '../../hooks/useAppQueries';
import {
  useV2PipelineRuns,
  useV2RunPipeline,
  useV2TemplateCatalog,
} from '../hooks/useV2Queries';
import type { TargetLocale } from '../types';

export function WorkbenchV2Page() {
  const { id = '' } = useParams();
  const { data: product, isLoading } = useProduct(id);
  const { data: catalog = [] } = useV2TemplateCatalog();
  const { data: templates = [] } = useTemplates();
  const { data: runs = [] } = useV2PipelineRuns(id);
  const runPipeline = useV2RunPipeline(id);

  const [locale, setLocale] = useState<TargetLocale>('vi-VN');
  const [templateId, setTemplateId] = useState('tpl-tshirt-a');
  const [adhocPrompt, setAdhocPrompt] = useState('');
  const [selectedOutput, setSelectedOutput] = useState<'exposure' | 'conversion'>('exposure');
  const [editTitle, setEditTitle] = useState('');

  const lastRun = runs[0];
  const output =
    selectedOutput === 'exposure' ? lastRun?.exposure : lastRun?.conversion;

  if (isLoading) {
    return (
      <V2Shell title="处理工作台" milestone="v2.0">
        <p className="text-muted">加载中…</p>
      </V2Shell>
    );
  }

  if (!product) {
    return (
      <V2Shell title="处理工作台" milestone="v2.0">
        <p className="text-muted">商品不存在</p>
        <Link to="/app/inbox" className="text-sm text-[var(--color-primary)]">
          返回采集箱
        </Link>
      </V2Shell>
    );
  }

  return (
    <V2Shell
      title="处理工作台"
      desc={`商品 #${id} · Mock AI 管线 · 双指标预览`}
      milestone="v2.0"
      actions={
        <Link to="/app/inbox">
          <Button type="button" variant="outline" size="sm">
            采集箱
          </Button>
        </Link>
      }
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="font-medium">原始数据</h2>
          <div className="mt-3 flex gap-3">
            <img src={product.thumb} alt="" className="h-20 w-20 rounded-lg object-cover" />
            <div className="min-w-0 text-sm">
              <p className="font-medium">{product.title}</p>
              <p className="text-muted">
                {product.source} · ¥{product.priceCny}
              </p>
              <a
                href={product.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-primary)]"
              >
                源链接
              </a>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-medium">管线配置</h2>
          <div className="mt-3 grid gap-2 text-sm">
            <label>
              <span className="text-muted">目标市场</span>
              <select
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2"
                value={locale}
                onChange={(e) => setLocale(e.target.value as TargetLocale)}
              >
                <option value="vi-VN">越南 Shopee</option>
                <option value="th-TH">泰国 TikTok</option>
                <option value="fil-PH">菲律宾 Shopee</option>
                <option value="id-ID">印尼 Shopee</option>
              </select>
            </label>
            <label>
              <span className="text-muted">类目模板</span>
              <select
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                {catalog.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.mode})
                  </option>
                ))}
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    我的 · {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-muted">临时 Prompt</span>
              <Input
                className="mt-1"
                value={adhocPrompt}
                onChange={(e) => setAdhocPrompt(e.target.value)}
                placeholder="仅当前商品生效"
              />
            </label>
          </div>
          <Button
            type="button"
            className="mt-3"
            disabled={runPipeline.isPending}
            onClick={() =>
              runPipeline.mutate(
                { templateId, locale, adhocPrompt: adhocPrompt || undefined },
                {
                  onSuccess: (res) => {
                    setEditTitle(res.run.exposure.title);
                  },
                },
              )
            }
          >
            运行管线（Mock）
          </Button>
        </Card>
      </div>

      {lastRun ? (
        <>
          <Card>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={selectedOutput === 'exposure' ? 'primary' : 'outline'}
                onClick={() => {
                  setSelectedOutput('exposure');
                  setEditTitle(lastRun.exposure.title);
                }}
              >
                高曝光
              </Button>
              <Button
                type="button"
                size="sm"
                variant={selectedOutput === 'conversion' ? 'primary' : 'outline'}
                onClick={() => {
                  setSelectedOutput('conversion');
                  setEditTitle(lastRun.conversion.title);
                }}
              >
                高转化
              </Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted">标题</p>
                <Input
                  className="mt-1"
                  value={editTitle || output?.title || ''}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              <div>
                <p className="text-xs text-muted">短描述</p>
                <p className="mt-1 text-sm">{output?.shortDescription}</p>
              </div>
              <div>
                <p className="text-xs text-muted">价格展示</p>
                <p className="mt-1 text-sm font-medium">{output?.priceLabel}</p>
              </div>
            </div>
            {lastRun.warnings.length > 0 ? (
              <ul className="mt-3 text-xs text-amber-700">
                {lastRun.warnings.map((w) => (
                  <li key={w}>⚠ {w}</li>
                ))}
              </ul>
            ) : null}
          </Card>

          <Card>
            <h2 className="font-medium">SKU（五段编码 Mock）</h2>
            <table className="mt-2 w-full text-left text-sm">
              <thead>
                <tr className="text-muted">
                  <th className="py-1">编码</th>
                  <th className="py-1">颜色</th>
                  <th className="py-1">尺码</th>
                  <th className="py-1">价/库存</th>
                </tr>
              </thead>
              <tbody>
                {lastRun.skus.map((s) => (
                  <tr key={s.skuCode} className="border-t border-[var(--color-border)]">
                    <td className="py-2 font-mono text-xs">{s.skuCode}</td>
                    <td className="py-2">{s.color}</td>
                    <td className="py-2">{s.size}</td>
                    <td className="py-2">
                      {s.price} / {s.stock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card>
            <h2 className="font-medium">图片处理（Mock 任务）</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline">
                消除笔
              </Button>
              <Button type="button" size="sm" variant="outline">
                翻译覆盖
              </Button>
              <Badge tone="warn">演示：调用 v1 image-jobs API 可接真实队列</Badge>
            </div>
          </Card>

          <div className="flex gap-2">
            <Link to="/app/publish">
              <Button type="button">前往发布中心</Button>
            </Link>
          </div>
        </>
      ) : (
        <Card>
          <p className="text-sm text-muted">运行管线后展示双指标结果与 SKU 表</p>
        </Card>
      )}
    </V2Shell>
  );
}
