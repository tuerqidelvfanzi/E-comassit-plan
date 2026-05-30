import { useState } from 'react';
import { Card, Button, Input } from '../../components/ui';
import { BANNED_TERMS } from '../../lib/bannedTerms';
import { V2Shell } from '../components/V2Shell';
import { PlatformRulesMatrix } from '../components/PlatformRulesMatrix';
import { useRules } from '../../hooks/useAppQueries';
import { api } from '../../lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/useAppQueries';

const groupLabel: Record<string, string> = {
  pricing: '定价',
  title: '标题',
  safety: '违禁',
  translation: '翻译',
};

export function RulesV2Page() {
  const { data: rules = [] } = useRules();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [expr, setExpr] = useState('price_vnd = price_cny * 3.5');

  const addRule = async () => {
    await api.saveRule({ name: name || '新规则', expr, group: 'pricing' });
    setName('');
    qc.invalidateQueries({ queryKey: queryKeys.rules });
  };

  return (
    <V2Shell
      title="规则库"
      desc="价格倍率、标题字数、违禁词与翻译规则（API 持久化 + Mock 校验）"
      milestone="v2.1"
    >
      <Card>
        <h2 className="font-medium">新增规则</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Input placeholder="规则名称" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="表达式" value={expr} onChange={(e) => setExpr(e.target.value)} />
        </div>
        <Button type="button" className="mt-3" onClick={addRule}>
          保存规则
        </Button>
      </Card>

      <Card>
        <h2 className="font-medium">规则列表</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-muted">
              <th className="py-2">名称</th>
              <th className="py-2">分组</th>
              <th className="py-2">表达式</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id ?? r.name} className="border-b border-[var(--color-border)]">
                <td className="py-2">{r.name}</td>
                <td className="py-2">{groupLabel[r.group] ?? r.group}</td>
                <td className="py-2 font-mono text-xs">{r.expr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <h2 className="font-medium">违禁词库（F-P-R05 · 演示）</h2>
        <p className="mt-1 text-xs text-muted">工作台文案区实时扫描；完整列表如下</p>
        <p className="mt-2 flex flex-wrap gap-1 text-xs">
          {BANNED_TERMS.slice(0, 12).map((t) => (
            <span key={t} className="rounded bg-[var(--color-muted)] px-1.5 py-0.5">
              {t}
            </span>
          ))}
          <span className="text-muted">…共 {BANNED_TERMS.length} 项</span>
        </p>
      </Card>

      <PlatformRulesMatrix />

      <Card>
        <h2 className="font-medium">默认市场倍率（Mock 参考）</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-muted">
          <li>越南 Shopee：原价 × 3.5</li>
          <li>泰国 TikTok：原价 × 2.5</li>
          <li>菲律宾 Shopee：固定低价档 PHP 299/399/499</li>
          <li>印尼 Shopee：原价 × 3.5（v2.3 适配器 beta）</li>
        </ul>
      </Card>
    </V2Shell>
  );
}
