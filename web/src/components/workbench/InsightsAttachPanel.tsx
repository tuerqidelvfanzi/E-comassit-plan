import { useV2Competitors } from '../../v2/hooks/useV2Queries';

type Props = {
  value: string;
  onChange: (next: string) => void;
};

export function InsightsAttachPanel({ value, onChange }: Props) {
  const { data: jobs = [] } = useV2Competitors();
  const done = jobs.filter((j) => j.status === 'done' && j.report);

  return (
    <div className="rounded-lg border border-[var(--color-border)] p-3 text-sm">
      <p className="font-medium">挂载竞品洞察（F-S-03）</p>
      <p className="mt-1 text-xs text-muted">将源平台热词写入临时 Prompt，供 AI 模糊段参考</p>
      <select
        className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm"
        defaultValue=""
        onChange={(e) => {
          const job = done.find((j) => j.id === e.target.value);
          if (!job?.report) return;
          const words = job.report.keywords.map((k) => k.word).join('、');
          const snippet = `【竞品 ${job.sourcePlatform}·${job.keyword}】热词：${words}；价带 ${job.report.priceRange.min}-${job.report.priceRange.max} CNY`;
          onChange(value ? `${value}\n${snippet}` : snippet);
        }}
      >
        <option value="">选择已完成的竞品任务…</option>
        {done.map((j) => (
          <option key={j.id} value={j.id}>
            {j.keyword}（{j.sourcePlatform}）
          </option>
        ))}
      </select>
      {done.length === 0 ? (
        <p className="mt-2 text-xs text-amber-700">请先在「竞品分析」运行 Mock 报告</p>
      ) : null}
    </div>
  );
}
