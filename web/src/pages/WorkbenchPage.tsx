import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader, Card, Badge, Button, Input } from '../components/ui';
import {
  useProduct,
  useRunPipeline,
  useTemplates,
  useUpdateProduct,
  useInvalidateProducts,
} from '../hooks/useAppQueries';
import { api } from '../lib/api';

export function WorkbenchPage() {
  const { id = '' } = useParams();
  const { data: p, isLoading } = useProduct(id);
  const { data: templates = [] } = useTemplates();
  const updateMut = useUpdateProduct();
  const pipelineMut = useRunPipeline();
  const invalidate = useInvalidateProducts();
  const [promptNote, setPromptNote] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [imageMsg, setImageMsg] = useState('');

  if (isLoading) {
    return <PageHeader title="处理工作台" desc="加载中…" />;
  }

  if (!p) {
    return (
      <PageHeader
        title="处理工作台"
        desc="商品不存在"
        action={
          <Link to="/app/inbox">
            <Button variant="outline">返回采集箱</Button>
          </Link>
        }
      />
    );
  }

  const activeTpl = templateId || templates.find((t) => t.status === 'active')?.id || '';
  const processed = p.processed;

  return (
    <>
      <PageHeader
        title="处理工作台"
        desc={p.title.slice(0, 40)}
        action={
          <Link to="/app/inbox">
            <Button variant="outline">返回</Button>
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-medium">原始数据</h2>
          <p className="mt-2 text-sm text-label">{p.title}</p>
          <p className="mt-1 text-sm">
            进价 ¥{p.priceCny} · {p.source}
          </p>
          <label className="mt-3 block text-sm">
            <span className="text-label">目标市场</span>
            <select
              className="mt-1 w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-2"
              value={p.targetLocale}
              onChange={(e) =>
                updateMut.mutate({
                  id: p.id,
                  patch: { targetLocale: e.target.value as 'vi-VN' | 'th-TH' },
                })
              }
            >
              <option value="vi-VN">越南 (vi-VN)</option>
              <option value="th-TH">泰国 (th-TH)</option>
            </select>
          </label>
          <a href={p.sourceUrl} className="mt-2 inline-block text-sm text-[var(--color-primary)]" target="_blank" rel="noreferrer">
            源链接
          </a>
        </Card>
        <Card>
          <h2 className="font-medium">处理管线</h2>
          <label className="mt-3 block text-sm">
            <span className="text-label">模板</span>
            <select
              className="mt-1 w-full rounded border p-2"
              value={activeTpl}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-sm">
            <span className="text-label">临时提示词</span>
            <Input
              className="mt-1"
              value={promptNote || p.pipelineNote || ''}
              onChange={(e) => setPromptNote(e.target.value)}
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              disabled={pipelineMut.isPending}
              onClick={() =>
                pipelineMut.mutate({
                  productId: p.id,
                  templateId: activeTpl,
                  adhocPrompt: promptNote || p.pipelineNote,
                })
              }
            >
              {pipelineMut.isPending ? '运行中…' : '运行管线'}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await api.createPublishTask({
                  platform: p.targetLocale === 'vi-VN' ? 'Shopee' : 'TikTok Shop',
                  title: p.processed?.conversion.title ?? p.title,
                  productId: p.id,
                });
                alert('已创建发布任务');
              }}
            >
              创建发布任务
            </Button>
          </div>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-medium text-muted">主图 ({p.images?.length ?? 0})</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {(p.images ?? [p.thumb]).slice(0, 6).map((url) => (
              <img key={url} src={url} alt="" className="h-16 w-16 rounded object-cover" />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const job = await api.createImageJob(p.id, ['dedupe_watermark', 'upscale']);
                  invalidate();
                  setImageMsg(`图片任务完成，新增 ${job.resultUrls?.length ?? 0} 张`);
                } catch {
                  setImageMsg('图片处理失败');
                }
              }}
            >
              AI 去水印 + 放大
            </Button>
          </div>
          {imageMsg ? <p className="mt-2 text-xs text-[var(--color-primary)]">{imageMsg}</p> : null}
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-muted">高曝光</h3>
          {processed ? (
            <>
              <p className="mt-2 font-medium">{processed.exposure.title}</p>
              <p className="text-sm text-label">{processed.exposure.priceLabel}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">运行管线后显示</p>
          )}
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-muted">高转化</h3>
          {processed ? (
            <>
              <p className="mt-2 font-medium">{processed.conversion.title}</p>
              <p className="text-sm text-label">{processed.conversion.priceLabel}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">运行管线后显示</p>
          )}
        </Card>
      </div>
    </>
  );
}
