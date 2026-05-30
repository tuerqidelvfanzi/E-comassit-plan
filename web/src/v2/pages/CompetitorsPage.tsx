import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Input } from '../../components/ui';
import { V2Shell } from '../components/V2Shell';
import { StatusChip } from '../components/StatusChip';
import {
  useCreateCompetitorJob,
  useRunCompetitorJob,
  useV2Competitors,
} from '../hooks/useV2Queries';

type TabId = 'insights' | 'similar';

export function CompetitorsPage() {
  const { data: jobs = [], isLoading } = useV2Competitors();
  const createJob = useCreateCompetitorJob();
  const runJob = useRunCompetitorJob();
  const [keyword, setKeyword] = useState('儿童 T恤 纯棉');
  const [platform, setPlatform] = useState('淘宝');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('insights');

  const selected = jobs.find((j) => j.id === selectedId) ?? jobs[0];

  return (
    <V2Shell
      title="竞品分析"
      desc="处理层 · 在源平台分析 TOP 词/价带，并找同类/类似在售款（非 B 站库检索）"
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
      <Card className="text-sm text-muted">
        <p>
          <strong className="text-[var(--color-fg)]">源平台</strong> = 淘宝/1688/拼多多或 Shopee·TikTok
          作本土竞品源；<strong className="text-[var(--color-fg)]">本平台</strong> = 仅展示与编排结果。选定链接后请到
          <Link to="/app/link-collect" className="mx-1 text-[var(--color-primary)]">
            链接直采
          </Link>
          或插件采集入库。
        </p>
      </Card>

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
              <option>TikTok泰国</option>
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
          <div className="flex gap-2 border-b border-[var(--color-border)] pb-2">
            <button
              type="button"
              className={`text-sm ${tab === 'insights' ? 'font-medium text-[var(--color-primary)]' : 'text-muted'}`}
              onClick={() => setTab('insights')}
            >
              品类洞察
            </button>
            <button
              type="button"
              className={`text-sm ${tab === 'similar' ? 'font-medium text-[var(--color-primary)]' : 'text-muted'}`}
              onClick={() => setTab('similar')}
            >
              找同类/类似款
            </button>
          </div>

          {!selected?.report ? (
            <p className="mt-3 text-sm text-muted">选择任务并运行分析后查看</p>
          ) : tab === 'insights' ? (
            <div className="mt-3 space-y-3 text-sm">
              <p>
                <span className="text-muted">分析上下文：</span>
                源平台 <strong>{selected.sourcePlatform}</strong>
              </p>
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
          ) : (
            <ul className="mt-3 divide-y divide-[var(--color-border)]">
              {(selected.report.similarProducts ?? []).map((item) => (
                <li key={item.sourceUrl} className="flex gap-3 py-3 text-sm">
                  <img src={item.thumb} alt="" className="h-14 w-14 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted">
                      ¥{item.priceCny} · {item.salesHint}
                    </p>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--color-primary)]"
                    >
                      源平台链接（Mock）
                    </a>
                  </div>
                </li>
              ))}
              {!selected.report.similarProducts?.length ? (
                <li className="py-2 text-muted">暂无类似款数据</li>
              ) : null}
            </ul>
          )}
        </Card>
      </div>
    </V2Shell>
  );
}
