import { PageHeader, Card, Badge, Button, Select } from '../components/ui';
import { ThemeSettings } from '../components/ThemeSettings';

export function SettingsPage() {
  return (
    <>
      <PageHeader title="设置" desc="外观、插件与模型配置" />
      <Card>
        <h2 className="font-medium">界面主题（CSS 配置）</h2>
        <p className="mt-2 text-sm text-muted">
          三种可选方案，选择后立即生效并保存在本浏览器；分享链接给他人时，对方使用各自本地保存的主题。
        </p>
        <div className="mt-4">
          <ThemeSettings />
        </div>
      </Card>
      <Card className="mt-4">
        <h2 className="font-medium">浏览器插件</h2>
        <p className="mt-2 text-sm text-muted">绑定后可在 A/C 站采集并回写草稿箱</p>
        <div className="mt-3 flex items-center gap-2">
          <Badge tone="warn">未绑定</Badge>
          <Button>生成插件 Token</Button>
        </div>
      </Card>
      <Card className="mt-4">
        <h2 className="font-medium">LLM 模型</h2>
        <p className="mt-2 text-sm text-muted">支持多模型 A/B（会议：排查 Prompt vs 模型）</p>
        <Select className="mt-2 w-full max-w-xs">
          <option>默认模型（待配置）</option>
          <option>GPT-4o</option>
          <option>Claude Sonnet</option>
        </Select>
      </Card>
    </>
  );
}
