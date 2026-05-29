import { PageHeader, Card, Button } from '../components/ui';
import { mockRules } from '../lib/mock';

export function RulesPage() {
  return (
    <>
      <PageHeader title="规则库" desc="确定性规则优先于 LLM" action={<Button>添加规则</Button>} />
      <div className="space-y-3">
        {mockRules.map((r) => (
          <Card key={r.name}>
            <h2 className="font-medium">{r.name}</h2>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted">{r.group}</p>
            <code className="code-block mt-2 block rounded bg-code p-2">{r.expr}</code>
          </Card>
        ))}
      </div>
    </>
  );
}
