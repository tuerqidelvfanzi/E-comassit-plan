import { useState } from 'react';
import { Card, Button, Input } from '../../components/ui';
import { V2Shell } from '../components/V2Shell';
import { StatusChip } from '../components/StatusChip';
import { useCreateLinkCollect, useV2LinkCollect } from '../hooks/useV2Queries';
import type { LinkCollectJob } from '../types';

export function LinkCollectPage() {
  const { data: jobs = [] } = useV2LinkCollect();
  const create = useCreateLinkCollect();
  const [url, setUrl] = useState('https://item.taobao.com/item.htm?id=demo');

  return (
    <V2Shell
      title="链接直采"
      desc="粘贴商品 URL，由 Mock Worker（Playwright）解析并预览入库字段"
      milestone="v2.2"
    >
      <Card>
        <label className="block text-sm">
          <span className="text-muted">商品链接</span>
          <Input
            className="mt-1"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
          />
        </label>
        <Button
          type="button"
          className="mt-3"
          disabled={create.isPending}
          onClick={() => create.mutate(url)}
        >
          提交直采任务
        </Button>
      </Card>

      <Card>
        <h2 className="font-medium">任务历史</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-muted">
                <th className="py-2 pr-2">平台</th>
                <th className="py-2 pr-2">进度</th>
                <th className="py-2 pr-2">状态</th>
                <th className="py-2">预览标题</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j: LinkCollectJob) => (
                <tr key={j.id} className="border-b border-[var(--color-border)]">
                  <td className="py-2 pr-2">{j.sourcePlatform}</td>
                  <td className="py-2 pr-2">{j.progress}%</td>
                  <td className="py-2 pr-2">
                    <StatusChip status={j.status} />
                  </td>
                  <td className="py-2">{j.productPreview?.title ?? j.message ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </V2Shell>
  );
}
