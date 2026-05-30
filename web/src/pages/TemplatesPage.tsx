import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, Card, Badge, Button, Input } from '../components/ui';
import { api } from '../lib/api';
import { queryKeys, useTemplates } from '../hooks/useAppQueries';
import type { TemplateItem, SkuConfig, CategoryTemplateId } from '../lib/api/types';
import { SkuEncodingTip } from '../components/SkuEncodingTip';

// 默认颜色列表
const DEFAULT_COLORS = [
  { label: '白色', value: 'WH' },
  { label: '黑色', value: 'BK' },
  { label: '红色', value: 'RD' },
  { label: '蓝色', value: 'BL' },
  { label: '绿色', value: 'GR' },
  { label: '黄色', value: 'YL' },
  { label: '粉色', value: 'PK' },
  { label: '紫色', value: 'PU' },
  { label: '橙色', value: 'OR' },
  { label: '灰色', value: 'GY' },
];

// 默认尺码列表
const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

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

// SKU编码说明tips
const SKU_TIPS = {
  prefix: '店铺名前缀，如"BF T-shirt"填写"BF"，用于生成SKU编码',
  sequence: 'SKU编号起始值，系统会自动递增',
  colors: '支持的颜色列表，选择商品实际有的颜色',
  sizes: '支持的尺码列表，T恤通常为S-XXXL',
  side: 'P=正面有图案，R=背面有图案，PR=正反面都有',
  printVariant: '+B=白底黑花（黑字印在白底上），+H=黑底白花（白字印在黑底上）',
  dummyHook: '单款式商品需要添加白色钩子占位，增加曝光',
};

// 颜色编码对应表tips
const COLOR_TIPS = 'WH=白色(White), BK=黑色(Black), RD=红色(Red), BL=蓝色(Blue), GR=绿色(Green), YL=黄色(Yellow), PK=粉色(Pink), PU=紫色(Purple), OR=橙色(Orange), GY=灰色(Gray)';

// Hook配置tips
const HOOK_TIPS = '白色钩子用于单款式商品，生成固定SKU如"BF-9999-P-WH-S"，价格400/库存5/重量220g';

export function TemplatesPage() {
  const { data: templates = [], isLoading } = useTemplates();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<TemplateItem | null>(null);
  const [showSkuConfig, setShowSkuConfig] = useState(false);
  const [tooltip, setTooltip] = useState<string | null>(null);

  // 初始化SKU配置
  const initSkuConfig = (): SkuConfig => ({
    prefix: 'BF',
    sequenceStart: 1,
    colors: ['WH', 'BK', 'PK'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    sides: ['PR'],
    printVariants: ['B', 'H'],
    dummyHook: {
      enabled: true,
      colorName: 'empty',
      price: 400,
      stock: 5,
      weight: 220,
    },
  });

  const createNewTemplate = () => {
    setEditing({
      id: `t-${Date.now()}`,
      name: '',
      status: 'draft',
      note: '',
      language: '中文/越南语',
      categoryId: 'tpl-clothing-tshirt',
      skuConfig: initSkuConfig(),
    });
    setShowSkuConfig(false);
  };

  const saveMut = useMutation({
    mutationFn: (item: TemplateItem) => api.saveTemplate(item),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.templates });
      setEditing(null);
      setShowSkuConfig(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.templates }),
  });

  // 切换颜色选中
  const toggleColor = (colorCode: string) => {
    if (!editing?.skuConfig) return;
    const colors = editing.skuConfig.colors;
    const newColors = colors.includes(colorCode)
      ? colors.filter((c) => c !== colorCode)
      : [...colors, colorCode];
    setEditing({
      ...editing,
      skuConfig: { ...editing.skuConfig, colors: newColors },
    });
  };

  // 切换尺码选中
  const toggleSize = (size: string) => {
    if (!editing?.skuConfig) return;
    const sizes = editing.skuConfig.sizes;
    const newSizes = sizes.includes(size)
      ? sizes.filter((s) => s !== size)
      : [...sizes, size];
    setEditing({
      ...editing,
      skuConfig: { ...editing.skuConfig, sizes: newSizes },
    });
  };

  // 切换正反面
  const toggleSide = (side: 'P' | 'R' | 'PR') => {
    if (!editing?.skuConfig) return;
    const sides = editing.skuConfig.sides;
    const newSides = sides.includes(side)
      ? sides.filter((s) => s !== side)
      : [...sides, side];
    setEditing({
      ...editing,
      skuConfig: { ...editing.skuConfig, sides: newSides.length > 0 ? newSides : sides },
    });
  };

  // 切换印花后缀
  const togglePrintVariant = (variant: 'B' | 'H') => {
    if (!editing?.skuConfig) return;
    const variants = editing.skuConfig.printVariants || [];
    const newVariants = variants.includes(variant)
      ? variants.filter((v) => v !== variant)
      : [...variants, variant];
    setEditing({
      ...editing,
      skuConfig: { ...editing.skuConfig, printVariants: newVariants },
    });
  };

  return (
    <>
      <PageHeader
        title="类目模板"
        desc="累积式类目 Prompt / SKU编码规则"
        action={
          <Button onClick={createNewTemplate}>
            + 新建模板
          </Button>
        }
      />

      {/* 模板编辑表单 */}
      {editing ? (
        <Card className="mb-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-muted mb-1">模板名称 *</label>
              <Input
                placeholder="如: 服装-T恤 越南站"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">模板分类</label>
              <select
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-2"
                value={editing.categoryId || 'tpl-other'}
                onChange={(e) => setEditing({ ...editing, categoryId: e.target.value as CategoryTemplateId })}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">说明</label>
            <Input
              placeholder="模板用途说明"
              value={editing.note}
              onChange={(e) => setEditing({ ...editing, note: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">目标语言</label>
            <select
              className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-2"
              value={editing.language}
              onChange={(e) => setEditing({ ...editing, language: e.target.value })}
            >
              <option value="中文/越南语">中文 → 越南语 (vi-VN)</option>
              <option value="中文/泰语">中文 → 泰语 (th-TH)</option>
              <option value="中文/印尼语">中文 → 印尼语 (id-ID)</option>
              <option value="中文/菲律宾语">中文 → 菲律宾语 (fil-PH)</option>
            </select>
          </div>

          {/* SKU配置区域 */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">SKU编码配置</h3>
                <SkuEncodingTip
                  categoryId={editing.categoryId}
                  language={editing.language}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSkuConfig(!showSkuConfig)}
              >
                {showSkuConfig ? '收起配置' : '展开配置'}
              </Button>
            </div>

            {showSkuConfig && (
              <div className="space-y-4 p-3 bg-[var(--color-surface)] rounded">
                {/* 前缀和起始编号 */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="flex items-center gap-1">
                      <label className="text-sm text-muted">店铺前缀</label>
                      <span
                        className="text-xs text-[var(--color-primary)] cursor-help"
                        title={SKU_TIPS.prefix}
                        onMouseEnter={() => setTooltip('prefix')}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        ❓
                      </span>
                    </div>
                    <Input
                      placeholder="如: BF"
                      value={editing.skuConfig?.prefix ?? 'BF'}
                      onChange={(e) => setEditing({
                        ...editing,
                        skuConfig: { ...(editing.skuConfig || initSkuConfig()), prefix: e.target.value.toUpperCase() }
                      })}
                    />
                    {tooltip === 'prefix' && (
                      <p className="mt-1 text-xs text-muted bg-[var(--color-surface)] p-2 rounded border">{SKU_TIPS.prefix}</p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <label className="text-sm text-muted">起始编号</label>
                      <span
                        className="text-xs text-[var(--color-primary)] cursor-help"
                        title={SKU_TIPS.sequence}
                        onMouseEnter={() => setTooltip('sequence')}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        ❓
                      </span>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      placeholder="1"
                      value={editing.skuConfig?.sequenceStart ?? 1}
                      onChange={(e) => setEditing({
                        ...editing,
                        skuConfig: { ...(editing.skuConfig || initSkuConfig()), sequenceStart: Number(e.target.value) }
                      })}
                    />
                    {tooltip === 'sequence' && (
                      <p className="mt-1 text-xs text-muted bg-[var(--color-surface)] p-2 rounded border">{SKU_TIPS.sequence}</p>
                    )}
                  </div>
                </div>

                {/* 颜色选择 */}
                <div>
                  <div className="flex items-center gap-1">
                    <label className="text-sm text-muted">颜色编码</label>
                    <span
                      className="text-xs text-[var(--color-primary)] cursor-help"
                      title={COLOR_TIPS}
                      onMouseEnter={() => setTooltip('colors')}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      ❓
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DEFAULT_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        className={`px-2 py-1 rounded text-sm border ${
                          editing.skuConfig?.colors?.includes(c.value)
                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                            : 'bg-[var(--color-surface)] border-[var(--color-border)]'
                        }`}
                        onClick={() => toggleColor(c.value)}
                      >
                        {c.label} ({c.value})
                      </button>
                    ))}
                  </div>
                  {tooltip === 'colors' && (
                    <p className="mt-2 text-xs text-muted bg-[var(--color-surface)] p-2 rounded border">{COLOR_TIPS}</p>
                  )}
                </div>

                {/* 尺码选择 */}
                <div>
                  <div className="flex items-center gap-1">
                    <label className="text-sm text-muted">尺码</label>
                    <span
                      className="text-xs text-[var(--color-primary)] cursor-help"
                      title={SKU_TIPS.sizes}
                      onMouseEnter={() => setTooltip('sizes')}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      ❓
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DEFAULT_SIZES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`px-3 py-1 rounded text-sm border ${
                          editing.skuConfig?.sizes?.includes(s)
                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                            : 'bg-[var(--color-surface)] border-[var(--color-border)]'
                        }`}
                        onClick={() => toggleSize(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  {tooltip === 'sizes' && (
                    <p className="mt-2 text-xs text-muted bg-[var(--color-surface)] p-2 rounded border">{SKU_TIPS.sizes}</p>
                  )}
                </div>

                {/* 正反面 */}
                <div>
                  <div className="flex items-center gap-1">
                    <label className="text-sm text-muted">印花位置</label>
                    <span
                      className="text-xs text-[var(--color-primary)] cursor-help"
                      title={SKU_TIPS.side}
                      onMouseEnter={() => setTooltip('side')}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      ❓
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(['P', 'R', 'PR'] as const).map((side) => (
                      <button
                        key={side}
                        type="button"
                        className={`px-3 py-1 rounded text-sm border ${
                          editing.skuConfig?.sides?.includes(side)
                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                            : 'bg-[var(--color-surface)] border-[var(--color-border)]'
                        }`}
                        onClick={() => toggleSide(side)}
                      >
                        {side === 'P' ? '正面 P' : side === 'R' ? '背面 R' : '正反面 PR'}
                      </button>
                    ))}
                  </div>
                  {tooltip === 'side' && (
                    <p className="mt-2 text-xs text-muted bg-[var(--color-surface)] p-2 rounded border">{SKU_TIPS.side}</p>
                  )}
                </div>

                {/* 印花后缀 */}
                <div>
                  <div className="flex items-center gap-1">
                    <label className="text-sm text-muted">印花后缀</label>
                    <span
                      className="text-xs text-[var(--color-primary)] cursor-help"
                      title={SKU_TIPS.printVariant}
                      onMouseEnter={() => setTooltip('printVariant')}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      ❓
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1">用于SKU六段编码，如 BF-0001-PR-WH-S+B</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {PRINT_VARIANT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`px-3 py-1 rounded text-sm border ${
                          editing.skuConfig?.printVariants?.includes(opt.value)
                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                            : 'bg-[var(--color-surface)] border-[var(--color-border)]'
                        }`}
                        onClick={() => togglePrintVariant(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {tooltip === 'printVariant' && (
                    <p className="mt-2 text-xs text-muted bg-[var(--color-surface)] p-2 rounded border">{SKU_TIPS.printVariant}</p>
                  )}
                </div>

                {/* 白色钩子配置 */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      id="hookEnabled"
                      checked={editing.skuConfig?.dummyHook?.enabled ?? true}
                      onChange={(e) => setEditing({
                        ...editing,
                        skuConfig: {
                          ...(editing.skuConfig || initSkuConfig()),
                          dummyHook: {
                            ...(editing.skuConfig?.dummyHook || initSkuConfig().dummyHook),
                            enabled: e.target.checked,
                          }
                        }
                      })}
                      className="mr-2"
                    />
                    <label htmlFor="hookEnabled" className="text-sm font-medium">启用白色钩子 (Hook)</label>
                    <span
                      className="text-xs text-[var(--color-primary)] cursor-help"
                      title={HOOK_TIPS}
                      onMouseEnter={() => setTooltip('hook')}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      ❓
                    </span>
                  </div>
                  {editing.skuConfig?.dummyHook?.enabled && (
                    <div className="grid gap-3 mt-2 md:grid-cols-4">
                      <div>
                        <label className="text-xs text-muted">颜色名称</label>
                        <Input
                          disabled
                          value={editing.skuConfig?.dummyHook?.colorName ?? 'empty'}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted">价格</label>
                        <Input
                          type="number"
                          value={editing.skuConfig?.dummyHook?.price ?? 400}
                          onChange={(e) => setEditing({
                            ...editing,
                            skuConfig: {
                              ...(editing.skuConfig || initSkuConfig()),
                              dummyHook: {
                                ...(editing.skuConfig?.dummyHook || initSkuConfig().dummyHook),
                                price: Number(e.target.value),
                              }
                            }
                          })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted">库存</label>
                        <Input
                          type="number"
                          value={editing.skuConfig?.dummyHook?.stock ?? 5}
                          onChange={(e) => setEditing({
                            ...editing,
                            skuConfig: {
                              ...(editing.skuConfig || initSkuConfig()),
                              dummyHook: {
                                ...(editing.skuConfig?.dummyHook || initSkuConfig().dummyHook),
                                stock: Number(e.target.value),
                              }
                            }
                          })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted">重量(g)</label>
                        <Input
                          type="number"
                          value={editing.skuConfig?.dummyHook?.weight ?? 220}
                          onChange={(e) => setEditing({
                            ...editing,
                            skuConfig: {
                              ...(editing.skuConfig || initSkuConfig()),
                              dummyHook: {
                                ...(editing.skuConfig?.dummyHook || initSkuConfig().dummyHook),
                                weight: Number(e.target.value),
                              }
                            }
                          })}
                        />
                      </div>
                    </div>
                  )}
                  {tooltip === 'hook' && (
                    <p className="mt-2 text-xs text-muted bg-[var(--color-surface)] p-2 rounded border">{HOOK_TIPS}</p>
                  )}
                </div>

                {/* SKU预览 */}
                {editing.skuConfig && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted mb-2">SKU编码预览 (六段格式):</p>
                    <div className="flex flex-wrap gap-2">
                      {editing.skuConfig.colors.slice(0, 2).map((color) =>
                        editing.skuConfig!.sizes.slice(0, 2).map((size) =>
                          editing.skuConfig!.printVariants?.slice(0, 2).map((variant) => (
                            <code key={`${color}-${size}-${variant}`} className="text-xs bg-muted px-2 py-1 rounded">
                              {editing.skuConfig!.prefix}-{String(editing.skuConfig!.sequenceStart).padStart(4, '0')}-{editing.skuConfig!.sides[0] || 'PR'}-{color}-{size}+{variant}
                            </code>
                          ))
                        )
                      )}
                      {(editing.skuConfig.colors.length > 2 || editing.skuConfig.sizes.length > 2) && (
                        <span className="text-xs text-muted">...</span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-2">格式：{editing.skuConfig.prefix}-序号-正反面-颜色-尺码+后缀</p>
                    {editing.skuConfig.dummyHook.enabled && (
                      <code className="mt-2 inline-block text-xs bg-muted px-2 py-1 rounded">
                        {editing.skuConfig.prefix}-9999-P-WH-{editing.skuConfig.sizes[0] || 'S'} (Hook)
                      </code>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              disabled={saveMut.isPending || !editing.name}
              onClick={() => saveMut.mutate(editing)}
            >
              {saveMut.isPending ? '保存中...' : '保存模板'}
            </Button>
            <Button variant="outline" onClick={() => { setEditing(null); setShowSkuConfig(false); }}>
              取消
            </Button>
          </div>
        </Card>
      ) : null}

      {/* 模板列表 */}
      {isLoading ? (
        <p className="text-sm text-muted">加载中…</p>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <Card key={t.id} className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-medium">{t.name}</h2>
                  <Badge tone={t.status === 'active' ? 'ok' : 'default'}>
                    {t.status === 'active' ? '启用' : '草稿'}
                  </Badge>
                  {t.skuConfig && (
                    <Badge tone="default">
                      SKU:{t.skuConfig.prefix}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {t.note} · {t.language}
                </p>
                {t.skuConfig && (
                  <p className="mt-1 text-xs text-muted">
                    颜色: {t.skuConfig.colors.join(', ')} | 尺码: {t.skuConfig.sizes.join(', ')}
                    {t.skuConfig.dummyHook.enabled && ' | Hook: ✓'}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setEditing(t);
                  setShowSkuConfig(!!t.skuConfig);
                }}>
                  编辑
                </Button>
                <Button variant="outline" onClick={() => confirm('删除？') && deleteMut.mutate(t.id)}>
                  删除
                </Button>
              </div>
            </Card>
          ))}
          {templates.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-muted">暂无模板，点击上方按钮创建</p>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
