import { useEffect, useState } from 'react';
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
import type { Product, ProductSku, PackageDimensions, CategoryTemplateId } from '../lib/api/types';

// 越南站标题最大字符数
const VIETNAM_TITLE_MAX = 20;
const VIETNAM_CJK_RECOMMENDED = 10;

// 颜色编码表
const COLOR_CODES: Record<string, string> = {
  '白色': 'WH', 'white': 'WH', 'WH': 'WH',
  '黑色': 'BK', 'black': 'BK', 'BK': 'BK',
  '红色': 'RD', 'red': 'RD', 'RD': 'RD',
  '蓝色': 'BL', 'blue': 'BL', 'BL': 'BL',
  '绿色': 'GR', 'green': 'GR', 'GR': 'GR',
  '黄色': 'YL', 'yellow': 'YL', 'YL': 'YL',
  '粉色': 'PK', 'pink': 'PK', 'PK': 'PK',
  '紫色': 'PU', 'purple': 'PU', 'PU': 'PU',
  '橙色': 'OR', 'orange': 'OR', 'OR': 'OR',
  '灰色': 'GY', 'gray': 'GY', 'GY': 'GY',
};

// 印花后缀选项
const PRINT_VARIANT_OPTIONS = [
  { value: 'B', label: '白底黑花 (+B)' },
  { value: 'H', label: '黑底白花 (+H)' },
] as const;

// 类目选项
const CATEGORY_OPTIONS: { value: CategoryTemplateId; label: string }[] = [
  { value: 'tpl-clothing-tshirt', label: '服装-T恤' },
  { value: 'tpl-clothing-general', label: '服装-通用' },
  { value: 'tpl-kitchenware', label: '厨具' },
  { value: 'tpl-lighting', label: '灯具' },
  { value: 'tpl-beauty', label: '美妆' },
  { value: 'tpl-electronics', label: '3C电子' },
  { value: 'tpl-home', label: '家居' },
  { value: 'tpl-other', label: '通用模板' },
];

// 默认包裹尺寸（菲律宾固定 10-5-10cm）
const DEFAULT_PACKAGE: PackageDimensions = { length: 10, width: 5, height: 10 };

// 违禁词列表（需求文档 §8.2 防侵权）
const BANNED_TERMS = [
  '耐克', 'Nike', '阿迪达斯', 'Adidas', '迪士尼', 'Disney', 'LV', '路易威登',
  'Gucci', '古驰', 'Chanel', '香奈儿', '爱马仕', 'Hermès',
  '苹果', 'Apple', '三星', 'Samsung', '华为', 'Huawei', 'NASA',
  '3C认证', '产地', '发货地', '最便宜', '全网最低', '绝对', '100%正品',
];

// 扫描违禁词
function scanBannedTerms(text: string): string[] {
  if (!text) return [];
  const found: string[] = [];
  for (const term of BANNED_TERMS) {
    if (text.includes(term)) {
      found.push(term);
    }
  }
  return found;
}

// 高亮违禁词
function highlightBannedTerms(text: string): React.ReactNode {
  if (!text) return null;
  let result: React.ReactNode[] = [];
  let remaining = text;
  let lastIndex = 0;

  for (const term of BANNED_TERMS) {
    const index = remaining.indexOf(term);
    if (index !== -1) {
      if (index > lastIndex) {
        result.push(remaining.slice(lastIndex, index));
      }
      result.push(
        <mark key={term + index} className="bg-red-200 text-red-700 px-0.5 rounded">
          {term}
        </mark>
      );
      lastIndex = index + term.length;
    }
  }

  if (lastIndex < remaining.length) {
    result.push(remaining.slice(lastIndex));
  }

  return result.length > 0 ? result : text;
}

// 计算字符数（Unicode字符）
function countChars(str: string): number {
  return [...str].length;
}

// 统计汉字数量
function countCjk(str: string): number {
  return ([...str].filter((c) => /[一-鿿]/.test(c))).length;
}

// 解析颜色编码
function resolveColorCode(color: string): string {
  const key = color.trim();
  return COLOR_CODES[key] ?? COLOR_CODES[key.toLowerCase()] ?? 'XX';
}

// 格式化序号
function formatSequence(n: number): string {
  return String(Math.max(1, Math.min(1000, Math.floor(n)))).padStart(4, '0');
}

// 生成SKU编码（前端六段版，支持印花后缀）
function encodeSkuWeb(
  prefix: string,
  sequence: number,
  side: string,
  color: string,
  size: string,
  printVariant?: string,
): string {
  const colorCode = resolveColorCode(color);
  const sizeCode = size.trim().toUpperCase();
  const seq = formatSequence(sequence);
  const variant = printVariant ? `+${printVariant}` : '';
  return `${prefix}-${seq}-${side}-${colorCode}-${sizeCode}${variant}`;
}

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

  // 编辑状态
  const [editingTitle, setEditingTitle] = useState('');
  const [editingShortDesc, setEditingShortDesc] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [editingSkus, setEditingSkus] = useState<ProductSku[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryTemplateId>('tpl-other');
  const [editingLogistics, setEditingLogistics] = useState<{ weight: number; dims: PackageDimensions }>({
    weight: 220,
    dims: DEFAULT_PACKAGE,
  });

  // 初始化编辑状态
  const initEditing = () => {
    if (p) {
      setEditingTitle(p.processed?.conversion.title ?? p.processed?.exposure.title ?? p.title);
      setEditingShortDesc(p.processed?.conversion.shortDescription ?? p.processed?.exposure.shortDescription ?? '');
      setEditingDescription(p.description || '');
      setEditingSkus(p.skus ? [...p.skus] : []);
      setEditingCategory((p.categoryId as CategoryTemplateId) || 'tpl-other');
      setIsEditing(true);
    }
  };

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

  // 标题字符统计
  const titleChars = countChars(editingTitle);
  const titleCjk = countCjk(editingTitle);
  const titleOk = titleChars <= VIETNAM_TITLE_MAX;
  const titleWarn = titleCjk > VIETNAM_CJK_RECOMMENDED;

  // 生成SKU编码（演示：五段 + 可选印花后缀）
  const generateSkuCode = (sku: ProductSku, index: number) => {
    const activeTemplate = templates.find((t) => t.id === activeTpl);
    const prefix = activeTemplate?.skuConfig?.prefix ?? 'BF';
    const sequence = (activeTemplate?.skuConfig?.sequenceStart ?? 1) + index;
    const side = sku.patternSuffix ?? activeTemplate?.skuConfig?.sides?.[0] ?? 'PR';
    return encodeSkuWeb(
      prefix,
      sequence,
      side,
      sku.color || sku.colorCode || 'XX',
      sku.size,
      sku.printVariant,
    );
  };

  useEffect(() => {
    if (!p) return;
    setEditingTitle(p.processed?.conversion.title ?? p.processed?.exposure.title ?? p.title);
    setEditingShortDesc(
      p.processed?.conversion.shortDescription ?? p.processed?.exposure.shortDescription ?? '',
    );
    setEditingDescription(p.description ?? '');
    setEditingSkus(p.skus?.length ? [...p.skus] : []);
    setEditingCategory((p.categoryId as CategoryTemplateId) || 'tpl-clothing-tshirt');
    const logistics = (p.attributes as { logistics?: { weightGrams?: number; packageDimensions?: PackageDimensions } })
      ?.logistics;
    if (logistics?.weightGrams) {
      setEditingLogistics({
        weight: logistics.weightGrams,
        dims: logistics.packageDimensions ?? DEFAULT_PACKAGE,
      });
    }
  }, [p?.id, p?.updatedAt]);

  // 保存编辑
  const saveEdits = () => {
    if (!p) return;
    const skusWithCodes = editingSkus.map((sku, idx) => ({
      ...sku,
      skuCode: generateSkuCode(sku, idx),
      name: sku.name || `${sku.color}-${sku.size}`,
    }));
    const processedPatch = processed
      ? {
          exposure: {
            ...processed.exposure,
            shortDescription: editingShortDesc,
          },
          conversion: {
            ...processed.conversion,
            title: editingTitle,
            shortDescription: editingShortDesc,
          },
        }
      : undefined;

    updateMut.mutate(
      {
        id: p.id,
        patch: {
          title: editingTitle,
          description: editingDescription,
          categoryId: editingCategory,
          skus: skusWithCodes,
          processed: processedPatch,
          attributes: {
            logistics: {
              weightGrams: editingLogistics.weight,
              packageDimensions: editingLogistics.dims,
            },
          },
        },
      },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  // 翻译图片
  const handleTranslate = async () => {
    if (!p) return;
    try {
      const job = await api.createImageJob(p.id, ['translate_overlay']);
      invalidate();
      setImageMsg(`翻译任务已创建`);
    } catch {
      setImageMsg('翻译失败');
    }
  };

  // 消除笔处理
  const handleWatermark = async () => {
    if (!p) return;
    try {
      const job = await api.createImageJob(p.id, ['dedupe_watermark', 'upscale']);
      invalidate();
      setImageMsg(`去水印完成，新增 ${job.resultUrls?.length ?? 0} 张`);
    } catch {
      setImageMsg('去水印失败');
    }
  };

  return (
    <>
      <PageHeader
        title="处理工作台"
        desc={p.title.slice(0, 40)}
        action={
          <div className="flex gap-2">
            {!isEditing ? (
              <Button variant="outline" onClick={initEditing}>编辑内容</Button>
            ) : (
              <>
                <Button onClick={saveEdits} disabled={updateMut.isPending}>保存</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>取消</Button>
              </>
            )}
            <Link to="/app/inbox">
              <Button variant="outline">返回</Button>
            </Link>
          </div>
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
                  patch: { targetLocale: e.target.value as Product['targetLocale'] },
                })
              }
            >
              <option value="vi-VN">越南 Shopee (vi-VN)</option>
              <option value="th-TH">泰国 TikTok (th-TH)</option>
              <option value="id-ID">印尼 Shopee (id-ID)</option>
              <option value="fil-PH">菲律宾 Shopee (fil-PH)</option>
            </select>
          </label>
          <a href={p.sourceUrl} className="mt-2 inline-block text-sm text-[var(--color-primary)]" target="_blank" rel="noreferrer">
            源链接 ↗
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
              placeholder="补充AI生成指令..."
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
                  title: editingTitle || (p.processed?.conversion.title ?? p.title),
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

      {/* 标题编辑区 */}
      <Card className="mt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">标题编辑</h3>
          <span className={`text-xs px-2 py-1 rounded ${titleOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {titleChars}/{VIETNAM_TITLE_MAX} 字符
            {titleCjk > 0 && ` (${titleCjk}汉字)`}
          </span>
        </div>
        {isEditing ? (
          <div className="mt-2">
            <textarea
              className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-sm"
              rows={2}
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              placeholder="输入优化后的标题..."
            />
            {titleWarn && (
              <p className="mt-1 text-xs text-orange-500">
                ⚠️ 汉字过多，建议压缩到{VIETNAM_CJK_RECOMMENDED}字以内
              </p>
            )}
            {/* 违禁词检测 */}
            {scanBannedTerms(editingTitle).length > 0 && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-xs text-red-600 font-medium">⚠️ 标题含违禁词：</p>
                <p className="text-xs text-red-500">
                  {scanBannedTerms(editingTitle).join(', ')}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-2">
            {scanBannedTerms(editingTitle).length > 0 ? (
              <p className="text-sm">{highlightBannedTerms(editingTitle || processed?.conversion.title || processed?.exposure.title || p.title)}</p>
            ) : (
              <p className="text-sm">{editingTitle || processed?.conversion.title || processed?.exposure.title || p.title}</p>
            )}
          </div>
        )}

        {/* 短描述 */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted">短描述（越南站≤20字符）</h4>
            <span className={`text-xs px-2 py-1 rounded ${countChars(editingShortDesc) <= 20 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {countChars(editingShortDesc)}/20
            </span>
          </div>
          {isEditing ? (
            <textarea
              className="mt-1 w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-sm"
              rows={2}
              value={editingShortDesc}
              onChange={(e) => setEditingShortDesc(e.target.value)}
              placeholder="简短描述..."
            />
          ) : (
            <p className="mt-1 text-sm text-muted">{editingShortDesc || '-'}</p>
          )}
          {/* 违禁词检测 */}
          {isEditing && scanBannedTerms(editingShortDesc).length > 0 && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
              <p className="text-xs text-red-600 font-medium">⚠️ 短描述含违禁词：</p>
              <p className="text-xs text-red-500">
                {scanBannedTerms(editingShortDesc).join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* 详细描述 */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted">详细描述（越南站13步流程：编详细描述）</h4>
          </div>
          {isEditing ? (
            <textarea
              className="mt-1 w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-sm"
              rows={6}
              value={editingDescription}
              onChange={(e) => setEditingDescription(e.target.value)}
              placeholder="输入详细描述，优化文案，删除品牌/产地/发货地/3C认证等违禁词..."
            />
          ) : (
            <p className="mt-1 text-sm text-muted whitespace-pre-wrap">{editingDescription || '暂无详细描述'}</p>
          )}
          {/* 违禁词检测 */}
          {isEditing && scanBannedTerms(editingDescription).length > 0 && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
              <p className="text-xs text-red-600 font-medium">⚠️ 详细描述含违禁词：</p>
              <p className="text-xs text-red-500">
                {scanBannedTerms(editingDescription).join(', ')}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* SKU编辑区 */}
      <Card className="mt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">SKU变体编辑 ({editingSkus.length}个)</h3>
          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // 添加一个空SKU
                setEditingSkus([
                  ...editingSkus,
                  { name: '', color: '', colorCode: '', size: '', price: p.priceCny, stock: 50, printVariant: 'B' },
                ]);
              }}
            >
              + 添加SKU
            </Button>
          )}
        </div>
        {editingSkus.length > 0 ? (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-muted">
                <tr>
                  <th className="p-2">颜色</th>
                  <th className="p-2">尺码</th>
                  <th className="p-2">印花</th>
                  <th className="p-2">价格</th>
                  <th className="p-2">库存</th>
                  <th className="p-2">SKU编码</th>
                  {isEditing && <th className="p-2">操作</th>}
                </tr>
              </thead>
              <tbody>
                {editingSkus.map((sku, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="p-2">
                      {isEditing ? (
                        <input
                          className="w-20 rounded border p-1 text-sm"
                          value={sku.color}
                          onChange={(e) => {
                            const updated = [...editingSkus];
                            updated[idx] = { ...sku, color: e.target.value };
                            setEditingSkus(updated);
                          }}
                          placeholder="如: 白色"
                        />
                      ) : (
                        sku.color
                      )}
                    </td>
                    <td className="p-2">
                      {isEditing ? (
                        <input
                          className="w-16 rounded border p-1 text-sm"
                          value={sku.size}
                          onChange={(e) => {
                            const updated = [...editingSkus];
                            updated[idx] = { ...sku, size: e.target.value };
                            setEditingSkus(updated);
                          }}
                          placeholder="如: M"
                        />
                      ) : (
                        sku.size
                      )}
                    </td>
                    <td className="p-2">
                      {isEditing ? (
                        <select
                          className="w-24 rounded border p-1 text-sm"
                          value={sku.printVariant || 'B'}
                          onChange={(e) => {
                            const updated = [...editingSkus];
                            updated[idx] = { ...sku, printVariant: e.target.value as 'B' | 'H' };
                            setEditingSkus(updated);
                          }}
                        >
                          {PRINT_VARIANT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs">{sku.printVariant ? `+${sku.printVariant}` : '-'}</span>
                      )}
                    </td>
                    <td className="p-2">
                      {isEditing ? (
                        <input
                          className="w-20 rounded border p-1 text-sm"
                          type="number"
                          value={sku.price}
                          onChange={(e) => {
                            const updated = [...editingSkus];
                            updated[idx] = { ...sku, price: Number(e.target.value) };
                            setEditingSkus(updated);
                          }}
                        />
                      ) : (
                        `¥${sku.price}`
                      )}
                    </td>
                    <td className="p-2">
                      {isEditing ? (
                        <input
                          className="w-16 rounded border p-1 text-sm"
                          type="number"
                          value={sku.stock}
                          onChange={(e) => {
                            const updated = [...editingSkus];
                            updated[idx] = { ...sku, stock: Number(e.target.value) };
                            setEditingSkus(updated);
                          }}
                        />
                      ) : (
                        sku.stock
                      )}
                    </td>
                    <td className="p-2">
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {isEditing ? generateSkuCode(sku, idx) : sku.skuCode || generateSkuCode(sku, idx)}
                      </code>
                    </td>
                    {isEditing && (
                      <td className="p-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingSkus(editingSkus.filter((_, i) => i !== idx));
                          }}
                        >
                          删除
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">暂无SKU数据，请运行管线生成</p>
        )}
      </Card>

      {/* 类目和物流信息 */}
      <Card className="mt-4">
        <h3 className="font-medium mb-3">类目与物流</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {/* 类目选择 */}
          <div>
            <label className="block text-sm text-muted mb-1">产品类目</label>
            {isEditing ? (
              <select
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-2"
                value={editingCategory}
                onChange={(e) => setEditingCategory(e.target.value as CategoryTemplateId)}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm">{CATEGORY_OPTIONS.find(c => c.value === p.categoryId)?.label || p.category || '未分类'}</p>
            )}
          </div>

          {/* 重量 */}
          <div>
            <label className="block text-sm text-muted mb-1">重量 (g)</label>
            {isEditing ? (
              <input
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-2"
                type="number"
                value={editingLogistics.weight}
                onChange={(e) => setEditingLogistics({ ...editingLogistics, weight: Number(e.target.value) })}
              />
            ) : (
              <p className="text-sm">{editingLogistics.weight}g</p>
            )}
          </div>
        </div>

        {/* 包裹尺寸 */}
        <div className="mt-4">
          <label className="block text-sm text-muted mb-1">包裹尺寸 (cm) - 长×宽×高</label>
          <p className="text-xs text-muted mb-2">菲律宾固定 10-5-10cm</p>
          {isEditing ? (
            <div className="flex gap-2 items-center">
              <input
                className="w-20 rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-sm"
                type="number"
                value={editingLogistics.dims.length}
                onChange={(e) => setEditingLogistics({ ...editingLogistics, dims: { ...editingLogistics.dims, length: Number(e.target.value) } })}
                placeholder="长"
              />
              <span>×</span>
              <input
                className="w-20 rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-sm"
                type="number"
                value={editingLogistics.dims.width}
                onChange={(e) => setEditingLogistics({ ...editingLogistics, dims: { ...editingLogistics.dims, width: Number(e.target.value) } })}
                placeholder="宽"
              />
              <span>×</span>
              <input
                className="w-20 rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-sm"
                type="number"
                value={editingLogistics.dims.height}
                onChange={(e) => setEditingLogistics({ ...editingLogistics, dims: { ...editingLogistics.dims, height: Number(e.target.value) } })}
                placeholder="高"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingLogistics({ ...editingLogistics, dims: DEFAULT_PACKAGE })}
              >
                恢复默认 (10-5-10)
              </Button>
            </div>
          ) : (
            <p className="text-sm">{editingLogistics.dims.length}-{editingLogistics.dims.width}-{editingLogistics.dims.height} cm</p>
          )}
        </div>
      </Card>

      {/* 双栏对比视图 */}
      <Card className="mt-4">
        <h3 className="font-medium mb-3">📝 双栏对比预译 <span className="text-xs text-muted font-normal">（左：原图/原标题，右：译图/优化标题）</span></h3>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* 左侧：原始数据 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-red-600">📷 原始图片</h4>
            <div className="grid grid-cols-3 gap-2">
              {(Array.isArray(p.images) ? p.images : [p.thumb]).slice(0, 6).map((img, idx) => {
                const url = typeof img === 'string' ? img : img.url;
                return (
                  <div key={idx} className="relative">
                    <img src={url} alt="" className="h-24 w-full rounded object-cover" />
                  </div>
                );
              })}
            </div>
            <div>
              <p className="text-xs text-muted">原始标题</p>
              <p className="text-sm font-medium">{p.title}</p>
            </div>
          </div>

          {/* 右侧：处理后数据 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-green-600">✨ 处理后（越南语本地化）</h4>
            {processed ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {(Array.isArray(p.images) ? p.images : [p.thumb]).slice(0, 6).map((img, idx) => {
                    const url = typeof img === 'string' ? img : img.url;
                    return (
                      <div key={idx} className="relative">
                        <img src={url} alt="" className="h-24 w-full rounded object-cover opacity-80" />
                        <span className="absolute bottom-0 left-0 right-0 bg-green-500/80 text-white text-xs text-center py-0.5 rounded-b">译</span>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <p className="text-xs text-muted">高曝光向</p>
                  <p className="text-sm font-medium text-green-700">{processed.exposure.title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">高转化向</p>
                  <p className="text-sm font-medium text-green-700">{processed.conversion.title}</p>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted">
                <p>运行管线后显示优化结果</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 图片处理区 */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted">主图 ({Array.isArray(p.images) ? p.images.length : 0})</h3>
            <span className="text-xs text-muted">越南站需9张 1:1 (800×800px)</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Array.isArray(p.images) ? p.images : [p.thumb]).slice(0, 9).map((img, idx) => {
              const url = typeof img === 'string' ? img : img.url;
              const isProcessed = (typeof img === 'object' && img?.status === 'processed') || false;
              const hasWatermark = typeof img === 'object' && img?.hasWatermark;
              return (
                <div key={idx} className="relative group">
                  <img src={url} alt="" className="h-20 w-20 rounded object-cover" />
                  {idx < 9 && (
                    <span className="absolute -top-1 -left-1 text-xs bg-[var(--color-primary)] text-white rounded-full w-4 h-4 flex items-center justify-center">
                      {idx + 1}
                    </span>
                  )}
                  {/* 状态指示器 */}
                  {hasWatermark && (
                    <span className="absolute -bottom-1 -right-1 text-xs bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center" title="含水印">
                      💧
                    </span>
                  )}
                  {isProcessed && (
                    <span className="absolute -bottom-1 -right-1 text-xs bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center" title="已处理">
                      ✓
                    </span>
                  )}
                  {/* 尺寸提示 */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                    1:1 正方形 · 越南站需9张
                  </div>
                </div>
              );
            })}
            {/* 填充空白格 */}
            {Math.max(0, 9 - (Array.isArray(p.images) ? p.images.length : 1)) > 0 && (
              Array.from({ length: Math.min(9, Math.max(0, 9 - (Array.isArray(p.images) ? p.images.length : 1))) }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20 w-20 rounded border-2 border-dashed border-muted flex items-center justify-center">
                  <span className="text-muted text-xs">待上传</span>
                </div>
              ))
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleWatermark}>
              🖌️ 消除笔/去水印
            </Button>
            <Button variant="outline" onClick={handleTranslate}>
              🌐 图片翻译（中→越）
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const job = await api.createImageJob(p.id, ['upscale']);
                  invalidate();
                  setImageMsg(`放大完成`);
                } catch {
                  setImageMsg('放大失败');
                }
              }}
            >
              📏 图片放大 1:1
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const cjk = /[\u4e00-\u9fff]/;
                const inTitle = cjk.test(editingTitle);
                const inDesc = cjk.test(editingShortDesc + editingDescription);
                setImageMsg(
                  inTitle || inDesc
                    ? '⚠️ 文案中仍含汉字，图片区请人工检查译图是否残留中文'
                    : '✓ 文案区未发现汉字，请目视确认主图译图',
                );
              }}
            >
              🔍 检测中文字体
            </Button>
          </div>
          {imageMsg ? (
            <div className={`mt-2 p-2 rounded text-xs ${imageMsg.includes('失败') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {imageMsg}
            </div>
          ) : null}
          {/* 图片处理提示 */}
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
            <p className="font-medium">📋 越南Shopee图片处理流程：</p>
            <ol className="mt-1 space-y-0.5 text-blue-600">
              <li>1. 挑选前9张图片</li>
              <li>2. 修改尺寸为1:1（800×800px）</li>
              <li>3. 用消除笔P掉敏感内容</li>
              <li>4. 中→越图片翻译</li>
              <li>5. 手动调整译图</li>
              <li>6. 检查中文字体残留</li>
            </ol>
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-muted">AI生成结果</h3>
          {processed ? (
            <div className="mt-2 space-y-3">
              <div>
                <p className="text-xs text-muted">高曝光向</p>
                <p className="font-medium">{processed.exposure.title}</p>
                <p className="text-sm text-label">{processed.exposure.priceLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted">高转化向</p>
                <p className="font-medium">{processed.conversion.title}</p>
                <p className="text-sm text-label">{processed.conversion.priceLabel}</p>
              </div>
              <p className="text-xs text-muted">
                处理时间: {new Date(processed.ranAt).toLocaleString('zh-CN')}
                {processed.modelUsed && ` · 模型: ${processed.modelUsed}`}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">运行管线后显示</p>
          )}
        </Card>
      </div>

      {/* 一键翻译越南语按钮 */}
      {isEditing && (
        <Card className="mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">越南站13步流程</h3>
              <p className="text-xs text-muted mt-1">越南Shopee上品：标题→描述→类目→SKU→图片→物流→保存→翻译→发布</p>
            </div>
            <Button
              onClick={async () => {
                // 一键翻译越南语
                try {
                  await api.createImageJob(p.id, ['translate_overlay']);
                  pipelineMut.mutate({
                    productId: p.id,
                    templateId: activeTpl,
                    adhocPrompt: `翻译成越南语，保持SEO优化，标题≤20字符`,
                  });
                  setImageMsg('已触发越南语翻译管线');
                } catch {
                  setImageMsg('翻译失败');
                }
              }}
            >
              🇻🇳 一键翻译越南语
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
