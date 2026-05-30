import { Link } from 'react-router-dom';
import { Card, Badge, Button } from '../../components/ui';
import { V2Shell } from '../components/V2Shell';
import { useV2InsightsDashboard } from '../hooks/useV2Queries';

export function InsightsV2Page() {
  const { data } = useV2InsightsDashboard();

  return (
    <V2Shell
      title="选品洞察"
      desc="GMV/CTR 分档、关键词趋势与竞品报告索引（Mock 统计）"
      milestone="v2.1"
      actions={
        <Link to="/app/competitors">
          <Button type="button" variant="outline">
            竞品分析
          </Button>
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-medium">关键词热度</h2>
          <ul className="mt-3 space-y-2">
            {data?.keywords.map((k) => (
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
            {data?.gmvBands.map((b) => (
              <li key={b.band} className="flex justify-between">
                <span>{b.band}</span>
                <span>{b.count} 款</span>
              </li>
            ))}
          </ul>
          <h2 className="mt-6 font-medium">CTR 分档</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data?.ctrBands.map((b) => (
              <li key={b.band} className="flex justify-between">
                <span>{b.band}</span>
                <span>{b.count} 款</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <h2 className="font-medium">爆款特征（Mock）</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-muted">
          {data?.topFeatures.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="font-medium">关联竞品报告</h2>
        <ul className="mt-2 divide-y divide-[var(--color-border)] text-sm">
          {data?.competitorReports.map((r) => (
            <li key={r.id} className="flex justify-between py-2">
              <span>{r.keyword}</span>
              <span className="text-muted">{new Date(r.updatedAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </Card>
    </V2Shell>
  );
}
