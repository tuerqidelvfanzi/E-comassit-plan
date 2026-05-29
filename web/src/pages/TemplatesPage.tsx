import { PageHeader, Card, Badge, Button } from '../components/ui';
import { mockTemplates } from '../lib/mock';

export function TemplatesPage() {
  return (
    <>
      <PageHeader title="类目模板" desc="累积式类目 Prompt，非万能 Prompt" action={<Button>新建模板</Button>} />
      <div className="space-y-3">
        {mockTemplates.map((t) => (
          <Card key={t.id} className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-medium">{t.name}</h2>
                <Badge tone={t.status === 'active' ? 'ok' : 'default'}>{t.status === 'active' ? '启用' : '草稿'}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">{t.note} · 目标语言：{t.language}</p>
            </div>
            <Button variant="outline">编辑 Prompt</Button>
          </Card>
        ))}
      </div>
    </>
  );
}
