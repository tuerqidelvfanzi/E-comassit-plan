import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, Button, Input, Badge } from '../../components/ui';
import { V2Shell } from '../components/V2Shell';
import { validateTitle, countTitleChars, VIETNAM_TITLE_MAX } from '../../lib/listingTitle';
import { useProduct, useTemplates, useUpdateProduct } from '../../hooks/useAppQueries';
import {
  useV2PipelineRuns,
  useV2RunPipeline,
  useV2TemplateCatalog,
} from '../hooks/useV2Queries';
import type { TargetLocale } from '../types';
import type { PackageDimensions } from '../../lib/api/types';
import { InsightsAttachPanel } from '../../components/workbench/InsightsAttachPanel';
import { CopyEditPanel } from '../../components/workbench/CopyEditPanel';
import { LogisticsPanel } from '../../components/workbench/LogisticsPanel';
import { ImageNineGridPanel } from '../../components/workbench/ImageNineGridPanel';
import { ImageTasksPanel } from '../../components/workbench/ImageTasksPanel';
import { FabricCheckBanner } from '../../components/workbench/FabricCheckBanner';

const SHOPEE_VN_STEPS = [
  '选择店铺',
  '创建商品',
  '上传 9 张图',
  '标题 ≤20 字',
  '类目',
  'SKU 价×3.5 库存50',
  '短描述',
  '长描述',
  '物流模板',
  '重量 220g',
  '包裹 10×5×10',
  '发布',
  '确认上架',
] as const;

const DEFAULT_PACKAGE: PackageDimensions = { length: 10, width: 5, height: 10 };

export function WorkbenchV2Page() {
  const { id = '' } = useParams();
  const { data: product, isLoading } = useProduct(id);
  const { data: catalog = [] } = useV2TemplateCatalog();
  const { data: templates = [] } = useTemplates();
  const { data: runs = [] } = useV2PipelineRuns(id);
  const runPipeline = useV2RunPipeline(id);
  const updateProduct = useUpdateProduct();

  const [locale, setLocale] = useState<TargetLocale>('vi-VN');
  const [templateId, setTemplateId] = useState('tpl-tshirt-a');
  const [adhocPrompt, setAdhocPrompt] = useState('');
  const [selectedOutput, setSelectedOutput] = useState<'exposure' | 'conversion'>('exposure');
  const [editTitle, setEditTitle] = useState('');
  const [editShortDesc, setEditShortDesc] = useState('');
  const [editLongDesc, setEditLongDesc] = useState('');
  const [weightGrams, setWeightGrams] = useState(220);
  const [packageDims, setPackageDims] = useState<PackageDimensions>(DEFAULT_PACKAGE);
  const [imageMsg, setImageMsg] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [vnSteps, setVnSteps] = useState<boolean[]>(() => SHOPEE_VN_STEPS.map(() => false));

  const lastRun = runs[0];
  const output =
    selectedOutput === 'exposure' ? lastRun?.exposure : lastRun?.conversion;

  const displayTitle = editTitle || output?.title || '';

  useEffect(() => {
    if (!product) return;
    setEditLongDesc(product.description ?? '');
    const proc = product.processed;
    if (proc) {
      setEditTitle(proc.conversion.title ?? proc.exposure.title ?? product.title);
      setEditShortDesc(proc.conversion.shortDescription ?? proc.exposure.shortDescription ?? '');
    }
  }, [product?.id]);

  useEffect(() => {
    if (output?.title && !editTitle) setEditTitle(output.title);
    if (output?.shortDescription) setEditShortDesc(output.shortDescription);
  }, [output?.title, output?.shortDescription]);

  const titleValidation = useMemo(() => {
    if (locale !== 'vi-VN' || !displayTitle) return null;
    return validateTitle(displayTitle);
  }, [locale, displayTitle]);

  const checklistFromRun = lastRun?.shopeeVnChecklist;

  async function handleSave() {
    if (!product) return;
    await updateProduct.mutateAsync({
      id: product.id,
      patch: {
        description: editLongDesc,
        processed: product.processed
          ? {
              ...product.processed,
              exposure: {
                ...product.processed.exposure,
                title: selectedOutput === 'exposure' ? displayTitle : product.processed.exposure.title,
                shortDescription:
                  selectedOutput === 'exposure' ? editShortDesc : product.processed.exposure.shortDescription,
              },
              conversion: {
                ...product.processed.conversion,
                title: selectedOutput === 'conversion' ? displayTitle : product.processed.conversion.title,
                shortDescription:
                  selectedOutput === 'conversion' ? editShortDesc : product.processed.conversion.shortDescription,
              },
            }
          : undefined,
        attributes: {
          ...(product.attributes ?? {}),
          weightGrams,
          packageDimensions: packageDims,
        },
      },
    });
    setSaveMsg('已保存草稿（演示）');
  }

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
      desc="演示完整：洞察挂载 · 文案/违禁 · 9 图 · 物流 · 管线 · 五段 SKU"
      milestone="v2.0"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleSave} disabled={updateProduct.isPending}>
            保存编辑
          </Button>
          <Link to="/app/inbox">
            <Button type="button" variant="outline" size="sm">
              采集箱
            </Button>
          </Link>
        </div>
      }
    >
      {saveMsg ? (
        <Card className="mb-4 border-[var(--color-primary)]">
          <p className="text-sm text-[var(--color-primary)]">{saveMsg}</p>
        </Card>
      ) : null}

      <FabricCheckBanner product={product} title={displayTitle} description={editLongDesc} />

      <Card className="mt-4 border-dashed border-[var(--color-primary)]/40">
        <p className="text-sm text-muted">
          源平台 <strong>{product.source}</strong> · 处理层加工 ·{' '}
          <Link to="/app/competitors" className="text-[var(--color-primary)]">
            竞品/找同类
          </Link>
        </p>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="font-medium">原始（源平台）</h2>
          <div className="mt-3 flex gap-3">
            <img src={product.thumb} alt="" className="h-20 w-20 rounded-lg object-cover" />
            <div className="min-w-0 text-sm">
              <p className="font-medium">{product.title}</p>
              <p className="text-muted">
                {product.source} · ¥{product.priceCny}
              </p>
              <a href={product.sourceUrl} target="_blank" rel="noreferrer" className="text-[var(--color-primary)]">
                源链接
              </a>
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="font-medium">处理后（目标市场）</h2>
          <div className="mt-3 text-sm">
            <p className="font-medium">{displayTitle || '—'}</p>
            <p className="mt-1 text-muted">{editShortDesc || output?.shortDescription || '—'}</p>
            <p className="mt-2 font-medium">{output?.priceLabel ?? '—'}</p>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
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
              <textarea
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-sm"
                rows={3}
                value={adhocPrompt}
                onChange={(e) => setAdhocPrompt(e.target.value)}
              />
            </label>
            <InsightsAttachPanel value={adhocPrompt} onChange={setAdhocPrompt} />
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
                    setEditShortDesc(res.run.exposure.shortDescription);
                    if (res.run.shopeeVnChecklist) {
                      setVnSteps(res.run.shopeeVnChecklist.map((s) => s.done));
                    }
                  },
                },
              )
            }
          >
            运行管线（Mock）
          </Button>
        </Card>

        {locale === 'vi-VN' ? (
          <Card>
            <h2 className="font-medium">越南 Shopee · 13 步</h2>
            <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto text-sm">
              {SHOPEE_VN_STEPS.map((label, i) => {
                const done = checklistFromRun?.[i]?.done ?? vnSteps[i];
                return (
                  <li key={label}>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => {
                          const next = [...vnSteps];
                          next[i] = !next[i];
                          setVnSteps(next);
                        }}
                      />
                      <span className={done ? 'text-muted line-through' : ''}>
                        {i + 1}. {label}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : (
          <Card>
            <h2 className="font-medium">物流（演示）</h2>
            <div className="mt-3">
              <LogisticsPanel
                weightGrams={weightGrams}
                packageDims={packageDims}
                onWeight={setWeightGrams}
                onDims={setPackageDims}
              />
            </div>
          </Card>
        )}
      </div>

      <Card className="mt-4">
        <h2 className="font-medium">文案编辑 · 违禁扫描</h2>
        <div className="mt-3">
          <CopyEditPanel
            locale={locale}
            title={displayTitle}
            shortDesc={editShortDesc}
            longDesc={editLongDesc}
            onTitle={setEditTitle}
            onShortDesc={setEditShortDesc}
            onLongDesc={setEditLongDesc}
          />
        </div>
      </Card>

      {locale === 'vi-VN' ? (
        <Card className="mt-4">
          <h2 className="font-medium">物流信息</h2>
          <div className="mt-3">
            <LogisticsPanel
              weightGrams={weightGrams}
              packageDims={packageDims}
              onWeight={setWeightGrams}
              onDims={setPackageDims}
            />
          </div>
        </Card>
      ) : null}

      <Card className="mt-4">
        <h2 className="font-medium">图片 · 9 槽位</h2>
        <div className="mt-3">
          <ImageNineGridPanel product={product} onMessage={setImageMsg} />
          {imageMsg ? <p className="mt-2 text-xs text-[var(--color-primary)]">{imageMsg}</p> : null}
        </div>
      </Card>

      {product ? (
        <div className="mt-4">
          <ImageTasksPanel
            imageUrls={(product.images ?? []).map((i) =>
              typeof i === 'string' ? i : i.url,
            )}
          />
        </div>
      ) : null}

      {lastRun ? (
        <>
          <Card className="mt-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={selectedOutput === 'exposure' ? 'primary' : 'outline'}
                onClick={() => {
                  setSelectedOutput('exposure');
                  setEditTitle(lastRun.exposure.title);
                  setEditShortDesc(lastRun.exposure.shortDescription);
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
                  setEditShortDesc(lastRun.conversion.shortDescription);
                }}
              >
                高转化
              </Button>
            </div>
            {lastRun.warnings.length > 0 ? (
              <ul className="mt-3 text-xs text-amber-700">
                {lastRun.warnings.map((w) => (
                  <li key={w}>⚠ {w}</li>
                ))}
              </ul>
            ) : null}
          </Card>

          <Card className="mt-4">
            <h2 className="font-medium">SKU（五段 · ADR-001）</h2>
            <table className="mt-2 w-full text-left text-sm">
              <thead>
                <tr className="text-muted">
                  <th className="py-1">编码</th>
                  <th className="py-1">印花</th>
                  <th className="py-1">颜色</th>
                  <th className="py-1">尺码</th>
                  <th className="py-1">价/库存</th>
                </tr>
              </thead>
              <tbody>
                {lastRun.skus.map((s) => (
                  <tr key={s.skuCode} className="border-t border-[var(--color-border)]">
                    <td className="py-2 font-mono text-xs">{s.skuCode}</td>
                    <td className="py-2">{s.printVariant ? <Badge tone="ok">+{s.printVariant}</Badge> : '—'}</td>
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
        </>
      ) : (
        <Card className="mt-4">
          <p className="text-sm text-muted">运行管线后展示 SKU 表</p>
        </Card>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/app/publish">
          <Button type="button">发布中心（生成填表）</Button>
        </Link>
        <Link to="/app/competitors">
          <Button type="button" variant="outline">
            竞品洞察
          </Button>
        </Link>
      </div>
    </V2Shell>
  );
}
