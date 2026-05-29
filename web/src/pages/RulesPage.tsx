import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, Card, Button, Input } from '../components/ui';
import { api } from '../lib/api';
import { queryKeys, useRules } from '../hooks/useAppQueries';
import type { RuleItem } from '../lib/api/types';

export function RulesPage() {
  const { data: rules = [] } = useRules();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<RuleItem | null>(null);

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

  return (
    <>
      <PageHeader
        title="规则库"
        desc="确定性规则优先于 LLM"
        action={<Button onClick={() => setDraft({ name: '', expr: '', group: 'pricing' })}>添加规则</Button>}
      />
      {draft ? (
        <Card className="mb-4 space-y-3">
          <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="名称" />
          <Input value={draft.expr} onChange={(e) => setDraft({ ...draft, expr: e.target.value })} placeholder="表达式" />
          <div className="flex gap-2">
            <Button onClick={() => draft.name && draft.expr && saveMut.mutate(draft)}>保存</Button>
            <Button variant="outline" onClick={() => setDraft(null)}>
              取消
            </Button>
          </div>
        </Card>
      ) : null}
      <div className="space-y-3">
        {rules.map((r) => (
          <Card key={r.id ?? r.name} className="flex justify-between gap-4">
            <div>
              <h2 className="font-medium">{r.name}</h2>
              <p className="text-xs text-muted">{r.group}</p>
              <code className="code-block mt-2 block rounded bg-code p-2">{r.expr}</code>
            </div>
            {r.id ? (
              <Button variant="outline" onClick={() => deleteMut.mutate(r.id!)}>
                删除
              </Button>
            ) : null}
          </Card>
        ))}
      </div>
    </>
  );
}
