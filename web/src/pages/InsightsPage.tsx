import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, Card, Button } from '../components/ui';
import { api } from '../lib/api';
import { queryKeys, useInsight } from '../hooks/useAppQueries';

export function InsightsPage() {
  const { data: insight, isLoading } = useInsight();
  const qc = useQueryClient();
  const runMut = useMutation({
    mutationFn: () => api.runInsight(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.insight }),
  });

  if (isLoading || !insight) {
    return <PageHeader title="选品洞察" desc="加载中…" />;
  }

  return (
    <>
      <PageHeader
        title="选品洞察"
        desc="关键词归纳与竞品特征"
        action={
          <Button variant="outline" disabled={runMut.isPending} onClick={() => runMut.mutate()}>
            {runMut.isPending ? '分析中…' : '重新分析'}
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-medium">关键词</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {insight.keywords.map((item) => (
              <span key={item.keyword} className="rounded-full bg-muted px-2 py-1 text-xs">
                {item.keyword} ({item.score})
              </span>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-medium">TOP10 特征</h2>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {insight.topFeatures.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
