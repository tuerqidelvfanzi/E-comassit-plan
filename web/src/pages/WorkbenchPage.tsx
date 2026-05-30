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
import type { ProductSku } from '../lib/api/types';

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

// 生成SKU编码（前端简化版）
function encodeSkuWeb(prefix: string, sequence: number, color: string, size: string): string {
  const colorCode = resolveColorCode(color);
  const sizeCode = size.trim().toUpperCase();
  const seq = formatSequence(sequence);
  return `${prefix}-${seq}-PR-${colorCode}-${sizeCode}`;
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
  const [editingSkus, setEditingSkus] = useState<ProductSku[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // 初始化编辑状态
  const initEditing = () => {
    if (p) {
      setEditingTitle(p.processed?.conversion.title ?? p.processed?.exposure.title ?? p.title);
      setEditingShortDesc(p.processed?.conversion.shortDescription ?? p.processed?.exposure.shortDescription ?? '');
      setEditingSkus(p.skus ? [...p.skus] : []);
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

  // 生成SKU编码
  const generateSkuCode = (sku: ProductSku, index: number) => {
    const activeTemplate = templates.find((t) => t.id === activeTpl);
    const prefix = activeTemplate?.skuConfig?.prefix ?? 'BF';
    const sequence = (activeTemplate?.skuConfig?.sequenceStart ?? 1) + index;
    return encodeSkuWeb(prefix, sequence, sku.color || sku.colorCode || 'XX', sku.size);
  };

  // 保存编辑
  const saveEdits = () => {
    if (!p) return;
    updateMut.mutate({
      id: p.id,
      patch: {
        title: editingTitle,
        targetLocale: p.targetLocale,
      },
    });
    setIsEditing(false);
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
                  patch: { targetLocale: e.target.value as 'vi-VN' | 'th-TH' },
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
          </div>
        ) : (
          <p className="mt-2 text-sm">{editingTitle || processed?.conversion.title || processed?.exposure.title || p.title}</p>
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
                  { name: '', color: '', colorCode: '', size: '', price: p.priceCny, stock: 50 },
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

      {/* 图片处理区 */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-medium text-muted">主图 ({Array.isArray(p.images) ? p.images.length : 0})</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Array.isArray(p.images) ? p.images : [p.thumb]).slice(0, 9).map((img, idx) => {
              const url = typeof img === 'string' ? img : img.url;
              return (
                <div key={idx} className="relative">
                  <img src={url} alt="" className="h-20 w-20 rounded object-cover" />
                  {idx < 9 && <span className="absolute -top-1 -left-1 text-xs bg-[var(--color-primary)] text-white rounded-full w-4 h-4 flex items-center justify-center">{idx + 1}</span>}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleWatermark}>
              🖌️ 消除笔/去水印
            </Button>
            <Button variant="outline" onClick={handleTranslate}>
              🌐 图片翻译
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
              📏 图片放大
            </Button>
          </div>
          {imageMsg ? <p className="mt-2 text-xs text-[var(--color-primary)]">{imageMsg}</p> : null}
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
    </>
  );
}
