import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, Button, Input, Badge } from '../../components/ui';
import { V2Shell } from '../components/V2Shell';
import { validateTitle, countTitleChars, VIETNAM_TITLE_MAX } from '../../lib/listingTitle';
import { useProduct, useTemplates } from '../../hooks/useAppQueries';
import {
  useV2PipelineRuns,
  useV2RunPipeline,
  useV2TemplateCatalog,
} from '../hooks/useV2Queries';
import type { TargetLocale } from '../types';

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
  const [vnSteps, setVnSteps] = useState<boolean[]>(() => SHOPEE_VN_STEPS.map(() => false));

  const lastRun = runs[0];
  const output =
    selectedOutput === 'exposure' ? lastRun?.exposure : lastRun?.conversion;

  const displayTitle = editTitle || output?.title || '';
  const titleValidation = useMemo(() => {
    if (locale !== 'vi-VN' || !displayTitle) return null;
    return validateTitle(displayTitle);
  }, [locale, displayTitle]);

  const checklistFromRun = lastRun?.shopeeVnChecklist;

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
      desc="处理层：规则段 + AI 段 · 双栏对比 · 越南 20 字 / 六段 SKU"
      milestone="v2.0"
      actions={
        <Link to="/app/inbox">
          <Button type="button" variant="outline" size="sm">
            采集箱
          </Button>
        </Link>
      }
    >
      <Card className="border-dashed border-[var(--color-primary)]/40 bg-[var(--color-surface)]">
        <p className="text-sm text-muted">
          <strong className="text-[var(--color-fg)]">处理层说明：</strong>
          竞品/找同类在源平台（{product.source}）完成；本页对采集箱商品做加工，可引用
          <Link to="/app/competitors" className="mx-1 text-[var(--color-primary)]">
            竞品洞察
          </Link>
          后发布至目标市场。
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
          <h2 className="font-medium">处理后（目标市场预览）</h2>
          {output ? (
            <div className="mt-3 text-sm">
              <p className="font-medium">{displayTitle || '—'}</p>
              <p className="mt-1 text-muted">{output.shortDescription}</p>
              <p className="mt-2 font-medium">{output.priceLabel}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">运行管线后显示</p>
          )}
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
              <span className="text-muted">临时 Prompt（模糊段）</span>
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
            <h2 className="font-medium">越南 Shopee · 13 步清单</h2>
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
        ) : null}
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
                  value={displayTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                {locale === 'vi-VN' ? (
                  <p
                    className={`mt-1 text-xs ${
                      titleValidation && !titleValidation.ok
                        ? 'text-red-600'
                        : 'text-muted'
                    }`}
                  >
                    {countTitleChars(displayTitle)} / {VIETNAM_TITLE_MAX} 字符
                    {titleValidation?.issues.map((issue) => (
                      <span key={issue.code} className="ml-2 block">
                        {issue.message}
                      </span>
                    ))}
                  </p>
                ) : null}
              </div>
              <div>
                <p className="text-xs text-muted">短描述</p>
                <p className="mt-1 text-sm">{output?.shortDescription}</p>
                {locale === 'vi-VN' && output?.shortDescription ? (
                  <p className="mt-1 text-xs text-muted">
                    短描述 {countTitleChars(output.shortDescription)} / {VIETNAM_TITLE_MAX} 字
                  </p>
                ) : null}
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
            <h2 className="font-medium">SKU（六段编码 · +B/+H）</h2>
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
                    <td className="py-2">
                      {s.printVariant ? (
                        <Badge tone="ok">+{s.printVariant}</Badge>
                      ) : (
                        '—'
                      )}
                    </td>
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
            <h2 className="font-medium">图片处理（9 张策略 · Mock）</h2>
            <p className="mt-1 text-xs text-muted">主图白底 + 模特正面；共 9 张槽位（演示未展开网格）</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline">
                消除笔
              </Button>
              <Button type="button" size="sm" variant="outline">
                翻译覆盖（越南语）
              </Button>
              <Badge tone="warn">Mock：可接 v1 image-jobs</Badge>
            </div>
          </Card>

          <div className="flex gap-2">
            <Link to="/app/publish">
              <Button type="button">前往发布中心</Button>
            </Link>
            <Link to="/app/competitors">
              <Button type="button" variant="outline">
                查看源平台洞察
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <Card>
          <p className="text-sm text-muted">运行管线后展示双指标、六段 SKU 与越南清单</p>
        </Card>
      )}
    </V2Shell>
  );
}
