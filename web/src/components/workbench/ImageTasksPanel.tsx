import { useState } from 'react';
import { Card, Button, Badge } from '../ui';

type TaskStatus = 'pending' | 'running' | 'done' | 'failed';

type ImageTask = {
  id: string;
  slot: number;
  type: 'erase' | 'translate';
  status: TaskStatus;
  message?: string;
};

const initialTasks = (urls: string[]): ImageTask[] =>
  urls.slice(0, 9).map((_, i) => ({
    id: `img-${i + 1}`,
    slot: i + 1,
    type: i % 2 === 0 ? 'erase' : 'translate',
    status: 'pending',
  }));

export function ImageTasksPanel({ imageUrls }: { imageUrls: string[] }) {
  const [tasks, setTasks] = useState(() => initialTasks(imageUrls));
  const [busy, setBusy] = useState(false);

  async function runAll(type: 'erase' | 'translate') {
    setBusy(true);
    for (const t of tasks.filter((x) => x.type === type)) {
      setTasks((prev) =>
        prev.map((p) => (p.id === t.id ? { ...p, status: 'running' as const } : p)),
      );
      await new Promise((r) => setTimeout(r, 400));
      setTasks((prev) =>
        prev.map((p) =>
          p.id === t.id
            ? {
                ...p,
                status: 'done' as const,
                message: type === 'erase' ? '已消除水印/价签（演示）' : '已生成越语覆盖建议（演示）',
              }
            : p,
        ),
      );
    }
    setBusy(false);
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-medium">图片任务队列（FR-P-07）</h2>
        <Badge tone="warn">演示 Mock</Badge>
      </div>
      <p className="mt-1 text-xs text-muted">
        消除笔：质保/包邮/LOGO；翻译：中→越。正式版对接 Worker 队列 API。
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => runAll('erase')}>
          批量消除笔
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => runAll('translate')}>
          批量翻译覆盖
        </Button>
      </div>
      <ul className="mt-3 divide-y divide-[var(--color-border)] text-sm">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center justify-between py-2">
            <span>
              槽位 {t.slot} · {t.type === 'erase' ? '消除' : '翻译'}
            </span>
            <span className="flex items-center gap-2">
              <Badge
                tone={
                  t.status === 'done' ? 'ok' : t.status === 'failed' ? 'warn' : 'default'
                }
              >
                {t.status}
              </Badge>
              {t.message ? <span className="text-xs text-muted">{t.message}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
