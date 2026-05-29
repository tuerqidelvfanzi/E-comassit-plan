import { useEffect, useState } from 'react';
import { PageHeader, Card } from '../components/ui';
import { ThemeSettings } from '../components/ThemeSettings';
import { ExtensionDownloadCard } from '../components/ExtensionDownloadCard';
import { ExtensionTokenCard } from '../components/ExtensionTokenCard';
import { ApiModeBanner } from '../components/ApiModeBanner';
import { WorkflowGuide } from '../components/WorkflowGuide';
import { LlmSettings } from '../components/LlmSettings';
import { SettingsSectionBoundary } from '../components/SettingsSectionBoundary';

function DeferredLlmSettings() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  if (!ready) {
    return <p className="text-sm text-muted">正在加载大模型配置…</p>;
  }
  return (
    <SettingsSectionBoundary title="大模型设置">
      <LlmSettings />
    </SettingsSectionBoundary>
  );
}

export function SettingsPage() {
  return (
    <>
      <PageHeader title="设置" desc="插件下载、外观与模型配置" />
      <ApiModeBanner />
      <Card className="mb-4">
        <h2 className="font-medium">标准作业流程</h2>
        <p className="mt-1 text-sm text-muted">从安装插件到目标平台上架的完整路径</p>
        <div className="mt-4">
          <WorkflowGuide compact />
        </div>
      </Card>
      <ExtensionDownloadCard />
      <ExtensionTokenCard />
      <Card className="mt-4">
        <h2 className="font-medium">界面主题（CSS 配置）</h2>
        <p className="mt-2 text-sm text-muted">选择配色方案后立即生效，并保存在本浏览器。</p>
        <div className="mt-4">
          <ThemeSettings />
        </div>
      </Card>
      <Card className="mt-4">
        <h2 className="font-medium">大模型设置</h2>
        <div className="mt-4">
          <DeferredLlmSettings />
        </div>
      </Card>
    </>
  );
}
