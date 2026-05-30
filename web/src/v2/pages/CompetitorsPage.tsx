import { useState } from 'react';
import { Card, Button, Input } from '../../components/ui';
import { V2Shell } from '../components/V2Shell';
import { StatusChip } from '../components/StatusChip';
import {
  useCreateCompetitorJob,
  useRunCompetitorJob,
  useV2Competitors,
} from '../hooks/useV2Queries';

export function CompetitorsPage() {
  const { data: jobs = [], isLoading } = useV2Competitors();
  const createJob = useCreateCompetitorJob();
  const runJob = useRunCompetitorJob();
  const [keyword, setKeyword] = useState('儿童 T恤 纯棉');
  const [platform, setPlatform] = useState('淘宝');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = jobs.find((j) => j.id === selectedId) ?? jobs[0];

  return (
    <V2Shell
      title="竞品分析"
      desc="在源平台分析 TOP 标题词、价格带与款式趋势（Mock Worker）"
      milestone="v2.1"
      actions={
        <Button
          type="button"
          disabled={createJob.isPending}
          onClick={() =>
            createJob.mutate({ keyword, sourcePlatform: platform }, {
              onSuccess: (j) => setSelectedId(j.id),
            })
          }
        >
          新建分析任务
        </Button>
      }
    >
      <Card>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <span className="text-muted">关键词</span>
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="mt-1" />
          </label>
          <label className="text-sm">
            <span className="text-muted">源平台</span>
            <select
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option>淘宝</option>
              <option>1688</option>
              <option>拼多多</option>
              <option>Shopee越南</option>
            </select>
          </label>
          <div className="flex items-end">
            <Button
              type="button"
              className="w-full"
              disabled={!selected || runJob.isPending}
              onClick={() => selected && runJob.mutate(selected.id)}
            >
              运行分析（Mock）
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-medium">任务列表</h2>
          {isLoading ? (
            <p className="mt-2 text-sm text-muted">加载中…</p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--color-border)]">
              {jobs.map((j) => (
                <li key={j.id}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between py-3 text-left text-sm ${
                      selected?.id === j.id ? 'font-medium text-[var(--color-primary)]' : ''
                    }`}
                    onClick={() => setSelectedId(j.id)}
                  >
                    <span>
                      {j.keyword}
                      <span className="ml-2 text-muted">({j.sourcePlatform})</span>
                    </span>
                    <StatusChip status={j.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-medium">分析报告</h2>
          {!selected?.report ? (
            <p className="mt-2 text-sm text-muted">选择任务并点击「运行分析」生成 Mock 报告</p>
          ) : (
            <div className="mt-3 space-y-3 text-sm">
              <p>
                <span className="text-muted">GMV 估算：</span>
                {selected.report.gmvEstimate}
              </p>
              <p>
                <span className="text-muted">CTR 估算：</span>
                {selected.report.ctrEstimate}
              </p>
              <p>
                <span className="text-muted">价格带：</span>
                {selected.report.priceRange.min}–{selected.report.priceRange.max}{' '}
                {selected.report.priceRange.currency}
              </p>
              <div>
                <p className="text-muted">热词</p>
                <ul className="mt-1 list-disc pl-5">
                  {selected.report.keywords.map((k) => (
                    <li key={k.word}>
                      {k.word}（{k.count}）· 分 {k.score}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-muted">样例标题</p>
                <ul className="mt-1 list-disc pl-5">
                  {selected.report.sampleTitles.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Card>
      </div>
    </V2Shell>
  );
}
