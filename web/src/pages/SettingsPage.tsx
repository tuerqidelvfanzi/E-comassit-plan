import { PageHeader, Card, Select } from '../components/ui';
import { ThemeSettings } from '../components/ThemeSettings';
import { ExtensionDownloadCard } from '../components/ExtensionDownloadCard';
import { WorkflowGuide } from '../components/WorkflowGuide';

export function SettingsPage() {
  return (
    <>
      <PageHeader title="设置" desc="插件下载、外观与模型配置" />
      <Card className="mb-4">
        <h2 className="font-medium">标准作业流程</h2>
        <p className="mt-1 text-sm text-muted">从安装插件到目标平台上架的完整路径</p>
        <div className="mt-4">
          <WorkflowGuide compact />
        </div>
      </Card>
      <ExtensionDownloadCard />
      <Card className="mt-4">
        <h2 className="font-medium">界面主题（CSS 配置）</h2>
        <p className="mt-2 text-sm text-muted">选择配色方案后立即生效，并保存在本浏览器。</p>
        <div className="mt-4">
          <ThemeSettings />
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
