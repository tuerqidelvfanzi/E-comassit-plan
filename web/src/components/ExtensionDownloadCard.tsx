import { useState } from 'react';
import { Badge, Button, Card } from './ui';
import { downloadExtensionZip, getExtensionDownloadUrl } from '../lib/extension';

export function ExtensionDownloadCard() {
  const [hint, setHint] = useState('');

  function onDownload() {
    downloadExtensionZip();
    setHint('若未开始下载，请检查浏览器是否拦截了弹出下载。');
  }

  return (
    <Card>
      <h2 className="font-medium">浏览器插件（演示版）</h2>
      <p className="mt-2 text-sm text-muted">
        用于在 1688、淘宝等源站采集商品信息，并回传至本后台采集箱。正式版将对接 API Token。
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted">
        <li>点击下方「下载插件」获取 ZIP</li>
        <li>解压后打开 Chrome → <code className="text-label">chrome://extensions</code></li>
        <li>开启「开发者模式」→「加载已解压的扩展程序」→ 选择解压目录</li>
        <li>在商品详情页打开插件，采集并「上传到采集箱」</li>
      </ol>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="ok">演示版 v0.2</Badge>
        <Button onClick={onDownload}>下载插件</Button>
      </div>
      <p className="mt-2 text-xs text-muted break-all">{getExtensionDownloadUrl()}</p>
      {hint ? <p className="mt-2 text-xs text-[var(--color-primary)]">{hint}</p> : null}
    </Card>
  );
}
