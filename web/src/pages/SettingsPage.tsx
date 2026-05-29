import { PageHeader, Card, Badge, Button } from '../components/ui';

export function SettingsPage() {
  return (
    <>
      <PageHeader title="设置" />
      <Card>
        <h2 className="font-medium">浏览器插件</h2>
        <p className="mt-2 text-sm text-slate-500">绑定后可在 A/C 站采集并回写草稿箱</p>
        <div className="mt-3 flex items-center gap-2">
          <Badge tone="warn">未绑定</Badge>
          <Button>生成插件 Token</Button>
        </div>
      </Card>
      <Card className="mt-4">
        <h2 className="font-medium">LLM 模型</h2>
        <p className="mt-2 text-sm text-slate-500">支持多模型 A/B（会议：排查 Prompt vs 模型）</p>
        <select className="mt-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
          <option>默认模型（待配置）</option>
          <option>GPT-4o</option>
          <option>Claude Sonnet</option>
        </select>
      </Card>
    </>
  );
}
