/**
 * 天猫标题优化 V1（七步流程 · V3.0 挂载版）
 *
 * 来源：V2 `v2/pages/TitleOptimizationPage.tsx`（v2 完整版）
 * 变更：
 *   - 替换 V2Shell 为 PageHeader + 卡片布局
 *   - 移除 MockBadge 装饰
 *   - 7 步流程不变：搜索词采集 → 生成 → 读取 → 对比 → 确认 → 写入
 *
 * 覆盖 PRD V3 §5.4 FR-TO-01..04 标题优化器 V1
 * 注：FR-TO-02 标题优化器 V2（多平台 SEO）走 `/app/title-optimizer-v2` 路由，本页不含此能力。
 */
import { useState } from 'react';
import { Card, Button, Input, Badge, PageHeader } from '../../components/ui';
import {
  useApplyTitleOptimization,
  useCompareTitleOptimization,
  useCreateTitleOptimizationJob,
  useFetchOriginalTitle,
  useGenerateOptimizationTitle,
  useTitleOptimizationCollectTerms,
  useTitleOptimizationJobs,
} from '../../v2/hooks/useV2Queries';
import type { TitleOptimizationJob } from '../../v2/types';

const STEPS = [
  '指定类目与商品 ID',
  '抓取搜索词（生意参谋）',
  '生成建议标题',
  '读取天猫原标题',
  '对比分析',
  '确认是否更换',
  '写入天猫卖家后台',
] as const;

function stepDone(job: TitleOptimizationJob | undefined, step: number): boolean {
  if (!job) return false;
  if (step === 1) return Boolean(job.id);
  if (step === 2) return (job.searchTerms?.length ?? 0) > 0;
  if (step === 3) return Boolean(job.generatedTitle);
  if (step === 4) return Boolean(job.originalTitle);
  if (step === 5) return Boolean(job.comparison);
  if (step === 6) return job.status === 'completed' || job.status === 'cancelled';
  if (step === 7) return job.status === 'completed';
  return job.currentStep >= step;
}

export function TitleOptimizationPage() {
  const { data: jobs = [], isLoading } = useTitleOptimizationJobs();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('电风扇');
  const [productId, setProductId] = useState('1053044184855');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const job = jobs.find((j) => j.id === selectedId) ?? jobs[0];

  const createJob = useCreateTitleOptimizationJob();
  const collectTerms = useTitleOptimizationCollectTerms();
  const generateTitle = useGenerateOptimizationTitle();
  const fetchOriginal = useFetchOriginalTitle();
  const compare = useCompareTitleOptimization();
  const apply = useApplyTitleOptimization();

  const busy =
    createJob.isPending ||
    collectTerms.isPending ||
    generateTitle.isPending ||
    fetchOriginal.isPending ||
    compare.isPending ||
    apply.isPending;

  return (
    <div className="space-y-4">
      <PageHeader
        title="天猫标题优化"
        desc="7 步流程：搜索词采集 → 生成 → 对比 → 确认后更换（对接 REQUIREMENTS_V3 §5.4）"
        action={
          <Button
            type="button"
            disabled={createJob.isPending}
            onClick={() =>
              createJob.mutate(
                { categoryName, tmallProductId: productId },
                { onSuccess: (j) => setSelectedId(j.id) },
              )
            }
          >
            新建优化任务
          </Button>
        }
      />

      <Card className="text-sm text-muted">
        <p>
          <strong className="text-[var(--color-fg)]">步骤二</strong>需已登录天猫账号，由后台 Worker
          访问「生意参谋 → 市场 → 搜索排行」；<strong className="text-[var(--color-fg)]">步骤七</strong>
          在天猫卖家中心改标题。当前演示为示例数据，流程与验收步骤与需求文档一致。
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="font-medium">任务列表</h2>
          {isLoading ? (
            <p className="mt-2 text-sm text-muted">加载中…</p>
          ) : jobs.length === 0 ? (
            <p className="mt-2 text-sm text-muted">暂无任务，请新建</p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--color-border)]">
              {jobs.map((j) => (
                <li key={j.id}>
                  <button
                    type="button"
                    className={`flex w-full flex-col gap-1 py-3 text-left text-sm ${
                      job?.id === j.id ? 'text-[var(--color-primary)]' : ''
                    }`}
                    onClick={() => setSelectedId(j.id)}
                  >
                    <span className="font-medium">{j.categoryName}</span>
                    <span className="text-muted">ID {j.tmallProductId}</span>
                    <Badge tone={j.status === 'completed' ? 'ok' : 'default'}>{j.status}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <h2 className="font-medium">步骤一 · 指定类目和商品 ID</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="text-muted">类目名称</span>
                <Input
                  className="mt-1"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
              </label>
              <label className="text-sm">
                <span className="text-muted">天猫商品 ID</span>
                <Input
                  className="mt-1"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                />
              </label>
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 font-medium">流程进度</h2>
            <ol className="space-y-2">
              {STEPS.map((label, i) => {
                const n = i + 1;
                const done = stepDone(job, n);
                const active = job?.currentStep === n;
                return (
                  <li
                    key={label}
                    className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                      active
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                        : 'border-[var(--color-border)]'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                        done
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-muted)] text-muted'
                      }`}
                    >
                      {n}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={done ? 'font-medium' : ''}>{label}</p>
                      {n === 2 && job?.id ? (
                        <Button
                          type="button"
                          className="mt-2"
                          variant="outline"
                          disabled={busy}
                          onClick={() => collectTerms.mutate(job.id)}
                        >
                          抓取搜索词（7 天排行）
                        </Button>
                      ) : null}
                      {n === 3 && job?.searchTerms?.length ? (
                        <Button
                          type="button"
                          className="mt-2"
                          variant="outline"
                          disabled={busy}
                          onClick={() => generateTitle.mutate(job.id)}
                        >
                          生成建议标题
                        </Button>
                      ) : null}
                      {n === 4 && job?.generatedTitle ? (
                        <Button
                          type="button"
                          className="mt-2"
                          variant="outline"
                          disabled={busy}
                          onClick={() => fetchOriginal.mutate(job.id)}
                        >
                          读取天猫原标题
                        </Button>
                      ) : null}
                      {n === 5 && job?.originalTitle ? (
                        <Button
                          type="button"
                          className="mt-2"
                          variant="outline"
                          disabled={busy}
                          onClick={() => compare.mutate(job.id)}
                        >
                          对比新旧标题
                        </Button>
                      ) : null}
                      {n === 6 && job?.comparison ? (
                        <div className="mt-2 flex gap-2">
                          <Button
                            type="button"
                            disabled={busy}
                            onClick={() => setConfirmOpen(true)}
                          >
                            确认更换
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={busy}
                            onClick={() =>
                              apply.mutate({ id: job.id, confirmed: false })
                            }
                          >
                            取消
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
            {job?.workerNote ? (
              <p className="mt-3 text-xs text-muted">{job.workerNote}</p>
            ) : null}
          </Card>

          {job?.searchTerms?.length ? (
            <Card>
              <h2 className="font-medium">搜索词排行（步骤二产出）</h2>
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="text-left text-muted">
                    <th className="pb-2">搜索词</th>
                    <th className="pb-2">统计</th>
                  </tr>
                </thead>
                <tbody>
                  {job.searchTerms.map((row) => (
                    <tr key={row.keyword} className="border-t border-[var(--color-border)]">
                      <td className="py-2">{row.keyword}</td>
                      <td className="py-2 text-muted">{row.metrics}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ) : null}

          {job?.comparison ? (
            <Card>
              <h2 className="font-medium">步骤五 · 对比结果</h2>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-[var(--color-border)] p-3">
                  <p className="text-xs text-muted">原始标题</p>
                  <p className="mt-1 font-medium">{job.comparison.originalTitle}</p>
                  <p className="mt-1 text-sm text-muted">{job.comparison.originalScore}</p>
                </div>
                <div className="rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary-soft)] p-3">
                  <p className="text-xs text-muted">建议标题</p>
                  <p className="mt-1 font-medium">{job.comparison.suggestedTitle}</p>
                  <p className="mt-1 text-sm text-muted">{job.comparison.suggestedScore}</p>
                </div>
              </div>
              <div className="mt-4 text-sm">
                <p>
                  <span className="text-muted">建议删除：</span>
                  {job.comparison.wordsToRemove.join('、')}
                </p>
                <p className="mt-1">
                  <span className="text-muted">建议加入：</span>
                  {job.comparison.wordsToAdd.join('、')}
                </p>
                <p className="mt-2 text-muted">其他建议：</p>
                <ol className="mt-1 list-decimal pl-5">
                  {job.comparison.otherSuggestions.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </div>
            </Card>
          ) : null}

          {job?.status === 'completed' && job.verificationNote ? (
            <Card>
              <Badge tone="ok">步骤七已完成</Badge>
              <p className="mt-2 text-sm">{job.verificationNote}</p>
              {job.appliedAt ? (
                <p className="mt-1 text-xs text-muted">
                  {new Date(job.appliedAt).toLocaleString()}
                </p>
              ) : null}
            </Card>
          ) : null}
        </div>
      </div>

      {confirmOpen && job ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <Card className="max-w-md">
            <h2 className="font-medium">步骤六 · 确认更换标题？</h2>
            <p className="mt-2 text-sm text-muted">
              将在天猫卖家后台修改商品 {job.tmallProductId} 的标题为：
            </p>
            <p className="mt-2 rounded bg-[var(--color-muted)] p-2 text-sm font-medium">
              {job.comparison?.suggestedTitle ?? job.generatedTitle}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)}>
                再想想
              </Button>
              <Button
                type="button"
                disabled={apply.isPending}
                onClick={() => {
                  apply.mutate(
                    { id: job.id, confirmed: true },
                    { onSuccess: () => setConfirmOpen(false) },
                  );
                }}
              >
                确认并执行步骤七
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

export default TitleOptimizationPage;
