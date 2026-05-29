import { PageHeader, Card, Button } from '../components/ui';
import { mockInsights } from '../lib/mock';

export function InsightsPage() {
  return (
    <>
      <PageHeader title="选品洞察" desc="竞品 TOP10、关键词归纳、流量词建议（P1）" />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-medium">同类标题 TOP100 关键词</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {mockInsights.map((item) => (
              <span key={item.keyword} className="rounded-full bg-muted px-2 py-1 text-xs text-label">
                {item.keyword} ({item.score})
              </span>
            ))}
          </div>
          <Button className="mt-4" variant="outline">
            重新分析
          </Button>
        </Card>
        <Card>
          <h2 className="font-medium">销量 TOP10 图与标题特征</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-label">
            <li>主图：白底 + 模特正面</li>
            <li>标题：年龄段 + 材质 + 场景</li>
          </ul>
          <Button className="mt-4" variant="outline">
            拉取竞品
          </Button>
        </Card>
        <Card className="md:col-span-2">
          <h2 className="font-medium">流量词替换建议</h2>
          <p className="mt-2 text-sm text-muted">
            计划从商品后台拉取流量数据，替换无流量词（RPA / 插件脚本，见项目规划）
          </p>
        </Card>
      </div>
    </>
  );
}
