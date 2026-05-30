import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, Card, Badge, Button, Input } from '../components/ui';
import { api } from '../lib/api';
import { queryKeys, useRules } from '../hooks/useAppQueries';
import type { RuleItem } from '../lib/api/types';

// 规则分组配置
const GROUP_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pricing: { label: '定价规则', color: 'blue', icon: '💰' },
  title: { label: '标题规则', color: 'green', icon: '📝' },
  safety: { label: '安全规则', color: 'red', icon: '🛡️' },
  translation: { label: '翻译规则', color: 'purple', icon: '🌐' },
};

// 预设规则模板
const PRESET_RULES: RuleItem[] = [
  { name: '越南 Shopee 定价', expr: 'price_vnd = price_cny * 3500 * 2.5', group: 'pricing' },
  { name: '泰国 THB 定价', expr: 'price_thb = price_cny * 5.2 * 1.8', group: 'pricing' },
  { name: '菲律宾固定定价', expr: 'price_fixed = 500 (PHP)', group: 'pricing' },
  { name: '越南库存设置', expr: 'stock = 50', group: 'pricing' },
  { name: '菲律宾库存设置', expr: 'stock = 800', group: 'pricing' },
  { name: '越南标题字数', expr: 'len(title) <= 20', group: 'title' },
  { name: '越南汉字压缩', expr: 'cjk_chars <= 10', group: 'title' },
  { name: '品牌违禁词', expr: 'filter_banned(Nike, Adidas, Disney, LV, Gucci)', group: 'safety' },
  { name: '国内标识过滤', expr: 'filter_domestic(3C认证, 产地, 发货地)', group: 'safety' },
  { name: '面料一致性检查', expr: 'check_material(cotton, polyester)', group: 'safety' },
  { name: '自动翻译', expr: 'translate(title, target_locale)', group: 'translation' },
  { name: '短描述翻译', expr: 'translate(short_desc, target_locale)', group: 'translation' },
];

// 规则描述说明
const RULE_DESCRIPTIONS: Record<string, string> = {
  '越南 Shopee 定价': '人民币成本 × 3.5(倍率) × 2.5(汇率) = 越南盾售价',
  '泰国 THB 定价': '人民币成本 × 2.5(倍率) × 1.8(汇率) = 泰铢售价',
  '越南标题字数': '越南站标题限制20字符，汉字需压缩到10字以内',
  '品牌违禁词': '过滤Nike/Adidas/Disney等大牌，防止侵权封店',
  '面料一致性检查': '标题描述的面料必须与实物一致，否则会被封店',
};

export function RulesPage() {
  const { data: rules = [] } = useRules();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<RuleItem | null>(null);
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [showPresets, setShowPresets] = useState(false);

  // 合并预设规则和用户规则
  const allRules = [...PRESET_RULES, ...rules];

  // 按分组筛选
  const filteredRules = activeGroup === 'all'
    ? allRules
    : allRules.filter(r => r.group === activeGroup);

  // 按分组统计
  const groupCounts = {
    all: allRules.length,
    pricing: allRules.filter(r => r.group === 'pricing').length,
    title: allRules.filter(r => r.group === 'title').length,
    safety: allRules.filter(r => r.group === 'safety').length,
    translation: allRules.filter(r => r.group === 'translation').length,
  };

  const saveMut = useMutation({
    mutationFn: (item: RuleItem) => api.saveRule(item),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.rules });
      setDraft(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.deleteRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.rules }),
  });

  const addPreset = (rule: RuleItem) => {
    saveMut.mutate(rule);
  };

  return (
    <>
      <PageHeader
        title="规则库"
        desc="确定性规则优先于 LLM · 保障上架合规与定价正确"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPresets(!showPresets)}>
              {showPresets ? '收起预设' : '📚 添加预设规则'}
            </Button>
            <Button onClick={() => setDraft({ name: '', expr: '', group: 'pricing' })}>
              + 自定义规则
            </Button>
          </div>
        }
      />

      {/* 预设规则面板 */}
      {showPresets && (
        <Card className="mb-4 bg-blue-50/50 dark:bg-blue-900/20 border-blue-200">
          <h3 className="font-medium mb-3">📚 预设规则模板</h3>
          <p className="text-sm text-muted mb-4">点击添加到规则库</p>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {PRESET_RULES.map((rule, idx) => (
              <div
                key={idx}
                className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-border hover:border-primary cursor-pointer transition"
                onClick={() => addPreset(rule)}
              >
                <div className="flex items-center gap-2">
                  <Badge tone={GROUP_CONFIG[rule.group]?.color as 'default' | 'ok' | 'warn'}>
                    {GROUP_CONFIG[rule.group]?.label}
                  </Badge>
                  <span className="text-sm font-medium">{rule.name}</span>
                </div>
                <code className="mt-1 block text-xs text-muted truncate">{rule.expr}</code>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 分组筛选 */}
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(groupCounts).map(([group, count]) => (
          <button
            key={group}
            onClick={() => setActiveGroup(group)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              activeGroup === group
                ? 'bg-primary text-white'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {group === 'all' ? '📋 全部' : `${GROUP_CONFIG[group]?.icon || ''} ${GROUP_CONFIG[group]?.label || group}`}
            <span className="ml-1 text-xs opacity-70">({count})</span>
          </button>
        ))}
      </div>

      {/* 添加规则表单 */}
      {draft ? (
        <Card className="mb-4 space-y-3 border-primary">
          <h3 className="font-medium">自定义规则</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="规则名称"
            />
            <select
              className="rounded border border-border bg-surface px-3 py-2 text-sm"
              value={draft.group}
              onChange={(e) => setDraft({ ...draft, group: e.target.value as RuleItem['group'] })}
            >
              {Object.entries(GROUP_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
              ))}
            </select>
            <Input
              value={draft.expr}
              onChange={(e) => setDraft({ ...draft, expr: e.target.value })}
              placeholder="表达式"
            />
          </div>
          <div className="flex gap-2">
            <Button
              disabled={saveMut.isPending || !draft.name || !draft.expr}
              onClick={() => draft.name && draft.expr && saveMut.mutate(draft)}
            >
              {saveMut.isPending ? '保存中...' : '保存规则'}
            </Button>
            <Button variant="outline" onClick={() => setDraft(null)}>
              取消
            </Button>
          </div>
        </Card>
      ) : null}

      {/* 规则列表 */}
      <div className="space-y-3">
        {filteredRules.map((r, idx) => (
          <Card
            key={`${r.id ?? r.name}-${idx}`}
            className="flex flex-wrap items-start justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-medium">{r.name}</h2>
                <Badge tone={GROUP_CONFIG[r.group]?.color as 'default' | 'ok' | 'warn'}>
                  {GROUP_CONFIG[r.group]?.icon} {GROUP_CONFIG[r.group]?.label}
                </Badge>
              </div>
              {RULE_DESCRIPTIONS[r.name] && (
                <p className="mt-1 text-xs text-muted">{RULE_DESCRIPTIONS[r.name]}</p>
              )}
              <code className="mt-2 block rounded bg-code p-2 text-sm overflow-x-auto">
                {r.expr}
              </code>
            </div>
            {r.id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteMut.mutate(r.id!)}
              >
                删除
              </Button>
            )}
          </Card>
        ))}
        {filteredRules.length === 0 && (
          <Card className="text-center py-8">
            <p className="text-muted">该分组暂无规则</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowPresets(true)}>
              从预设中添加
            </Button>
          </Card>
        )}
      </div>

      {/* 规则执行顺序说明 */}
      <Card className="mt-6 bg-yellow-50/50 dark:bg-yellow-900/20 border-yellow-200">
        <h3 className="font-medium mb-2">⚡ 规则执行顺序</h3>
        <div className="text-sm text-muted space-y-1">
          <p>1. <strong>安全规则</strong> → 过滤违禁词、品牌侵权、国内标识</p>
          <p>2. <strong>标题规则</strong> → 字符数限制、汉字压缩</p>
          <p>3. <strong>定价规则</strong> → 根据目标市场计算售价</p>
          <p>4. <strong>翻译规则</strong> → 最后执行翻译，避免翻译无效内容</p>
        </div>
      </Card>
    </>
  );
}
