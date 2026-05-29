import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, Card, Badge, Button, Input } from '../components/ui';
import { api } from '../lib/api';
import { queryKeys, useTemplates } from '../hooks/useAppQueries';
import type { TemplateItem } from '../lib/api/types';

export function TemplatesPage() {
  const { data: templates = [], isLoading } = useTemplates();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<TemplateItem | null>(null);

  const saveMut = useMutation({
    mutationFn: (item: TemplateItem) => api.saveTemplate(item),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.templates });
      setEditing(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.templates }),
  });

  return (
    <>
      <PageHeader
        title="类目模板"
        desc="累积式类目 Prompt"
        action={
          <Button
            onClick={() =>
              setEditing({
                id: `t-${Date.now()}`,
                name: '',
                status: 'draft',
                note: '',
                language: '中文/越南语',
              })
            }
          >
            新建模板
          </Button>
        }
      />
      {editing ? (
        <Card className="mb-4 space-y-3">
          <Input placeholder="名称" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          <Input placeholder="说明" value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })} />
          <Input
            placeholder="语言"
            value={editing.language}
            onChange={(e) => setEditing({ ...editing, language: e.target.value })}
          />
          <div className="flex gap-2">
            <Button disabled={saveMut.isPending} onClick={() => editing.name && saveMut.mutate(editing)}>
              保存
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>
              取消
            </Button>
          </div>
        </Card>
      ) : null}
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
                </div>
                <p className="mt-1 text-sm text-muted">
                  {t.note} · {t.language}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditing(t)}>
                  编辑
                </Button>
                <Button variant="outline" onClick={() => confirm('删除？') && deleteMut.mutate(t.id)}>
                  删除
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
