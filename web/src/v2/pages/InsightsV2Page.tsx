import { Link } from 'react-router-dom';
import { Card, Badge, Button } from '../../components/ui';
import { V2Shell } from '../components/V2Shell';
import { useV2InsightsDashboard } from '../hooks/useV2Queries';

export function InsightsV2Page() {
  const { data, isLoading } = useV2InsightsDashboard();

  return (
    <V2Shell
      title="选品洞察"
      desc="汇总多次竞品分析；报告列表来自已完成的任务（FR-I-02）"
      milestone="v2.1"
      actions={
        <Link to="/app/competitors">
          <Button type="button" variant="outline">
            去竞品分析
          </Button>
        </Link>
      }
    >
      <Card className="text-sm text-muted">
        <p>
          <strong className="text-[var(--color-fg)]">数据说明：</strong>
          「关联竞品报告」= 竞品分析页已跑完的任务；热词/分档在演示环境为示例统计，正式版由
          Worker 拉取。请先完成至少一次竞品分析，否则报告列表为空。
        </p>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted">加载中…</p>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="font-medium">关键词热度</h2>
              <ul className="mt-3 space-y-2">
                {(data?.keywords ?? []).map((k) => (
                  <li key={k.keyword} className="flex items-center justify-between text-sm">
                    <span>{k.keyword}</span>
                    <span className="flex items-center gap-2">
                      <Badge tone="ok">{k.score}</Badge>
                      <span className="text-muted">{k.trend}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h2 className="font-medium">GMV 分档</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {(data?.gmvBands ?? []).map((b) => (
                  <li key={b.band} className="flex justify-between">
                    <span>{b.band}</span>
                    <span>{b.count} 款</span>
                  </li>
                ))}
              </ul>
              <h2 className="mt-6 font-medium">CTR 分档</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {(data?.ctrBands ?? []).map((b) => (
                  <li key={b.band} className="flex justify-between">
                    <span>{b.band}</span>
                    <span>{b.count} 款</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card>
            <h2 className="font-medium">爆款特征</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted">
              {(data?.topFeatures ?? []).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="font-medium">关联竞品报告</h2>
            {(data?.competitorReports ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-muted">
                暂无报告。请先在{' '}
                <Link to="/app/competitors" className="text-[var(--color-primary)]">
                  竞品分析
                </Link>{' '}
                新建并运行任务。
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-[var(--color-border)] text-sm">
                {data?.competitorReports.map((r) => (
                  <li key={r.id} className="flex justify-between py-2">
                    <Link to="/app/competitors" className="text-[var(--color-primary)]">
                      {r.keyword}
                    </Link>
                    <span className="text-muted">
                      {new Date(r.updatedAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="font-medium">与工作台联动（FR-I-03 / F-S-03）</h2>
            <p className="mt-2 text-sm text-muted">
              在{' '}
              <Link to="/app/workbench/p1" className="text-[var(--color-primary)]">
                处理工作台
              </Link>{' '}
              使用「竞品洞察」下拉，将本次分析结论写入临时 Prompt。
            </p>
          </Card>
        </>
      )}
    </V2Shell>
  );
}
