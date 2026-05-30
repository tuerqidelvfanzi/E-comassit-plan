import { Link } from 'react-router-dom';
import { PageHeader, Card, Badge, Button } from '../components/ui';
import { WorkflowGuide } from '../components/WorkflowGuide';
import { ApiModeBanner } from '../components/ApiModeBanner';
import { downloadExtensionZip } from '../lib/extension';
import { useMetrics } from '../hooks/useAppQueries';

// 快速入口配置
const QUICK_ACTIONS = [
  { icon: '🔌', label: '插件采集', desc: '从1688/淘宝/拼多多采集', to: '/app/inbox', color: 'blue' },
  { icon: '📦', label: '批量采集', desc: 'TOP榜单批量抓取', to: '/app/batch-collect', color: 'purple' },
  { icon: '⚙️', label: '处理工作台', desc: '运行管线生成标题描述', to: '/app/inbox', color: 'green' },
  { icon: '🚀', label: '发布中心', desc: '创建任务并填表', to: '/app/publish', color: 'orange' },
  { icon: '📊', label: '选品洞察', desc: '竞品分析转化追踪', to: '/app/insights', color: 'red' },
  { icon: '📋', label: '类目模板', desc: 'SKU编码规则配置', to: '/app/templates', color: 'teal' },
];

// 近期活动模拟
const RECENT_ACTIVITIES = [
  { time: '今天 10:30', icon: '📦', text: '从1688采集商品「韩版童装连衣裙」', type: 'collect' },
  { time: '今天 10:25', icon: '⚙️', text: '处理商品「儿童纯棉T恤」，状态更新为处理中', type: 'process' },
  { time: '今天 09:50', icon: '📝', text: '创建发布任务「婴儿连体衣」→ Shopee越南', type: 'publish' },
  { time: '昨天 18:30', icon: '✅', text: '商品「女童牛仔背带裤」已发布', type: 'complete' },
  { time: '昨天 15:20', icon: '📊', text: '选品洞察分析完成，发现3个爆品', type: 'insight' },
];

export function DashboardPage() {
  const { data: m, isLoading } = useMetrics();

  return (
    <>
      <PageHeader
        title="工作台"
        desc="采集 → 编辑 → 草稿 → 正式发布的运营中枢"
        action={<Button onClick={downloadExtensionZip}>📦 下载插件</Button>}
      />
      <ApiModeBanner />

      {/* 快速入口 */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.label} to={action.to}>
            <Card className="h-full hover:border-primary/50 transition cursor-pointer">
              <div className="text-2xl mb-2">{action.icon}</div>
              <div className="font-medium text-sm">{action.label}</div>
              <div className="text-xs text-muted mt-1">{action.desc}</div>
            </Card>
          </Link>
        ))}
      </div>

      {/* 作业流程 */}
      <Card className="mb-6">
        <h2 className="mb-3 font-medium">📋 标准作业流程 (SOP)</h2>
        <WorkflowGuide />
      </Card>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="bg-blue-50 dark:bg-blue-900/20">
          <p className="text-sm text-blue-600 dark:text-blue-400">待处理</p>
          <p className="mt-1 text-2xl font-bold">{isLoading ? '—' : m?.rawCount ?? 0}</p>
          <Badge tone="warn" className="mt-2">需处理</Badge>
        </Card>
        <Card className="bg-yellow-50 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">处理中</p>
          <p className="mt-1 text-2xl font-bold">{isLoading ? '—' : m?.processingCount ?? 0}</p>
          <Badge className="mt-2">进行中</Badge>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/20">
          <p className="text-sm text-green-600 dark:text-green-400">可发布</p>
          <p className="mt-1 text-2xl font-bold">{isLoading ? '—' : m?.readyCount ?? 0}</p>
          <Badge tone="ok" className="mt-2">就绪</Badge>
        </Card>
        <Card className="bg-purple-50 dark:bg-purple-900/20">
          <p className="text-sm text-purple-600 dark:text-purple-400">已发布</p>
          <p className="mt-1 text-2xl font-bold">{isLoading ? '—' : m?.publishedCount ?? 0}</p>
          <Badge tone="ok" className="mt-2">完成</Badge>
        </Card>
        <Card className="bg-orange-50 dark:bg-orange-900/20">
          <p className="text-sm text-orange-600 dark:text-orange-400">今日采集</p>
          <p className="mt-1 text-2xl font-bold">{isLoading ? '—' : Math.floor((m?.rawCount ?? 0) * 0.3)}</p>
          <Badge className="mt-2">+新增</Badge>
        </Card>
        <Card className="bg-gray-50 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">商品总量</p>
          <p className="mt-1 text-2xl font-bold">{isLoading ? '—' : m?.totalProducts ?? 0}</p>
          <Badge className="mt-2">全部</Badge>
        </Card>
      </div>

      {/* 近期活动 */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="font-medium mb-4">📜 近期活动</h3>
          <div className="space-y-3">
            {RECENT_ACTIVITIES.map((activity, idx) => (
              <div key={idx} className="flex gap-3 text-sm">
                <span className="text-lg">{activity.icon}</span>
                <div className="flex-1">
                  <p>{activity.text}</p>
                  <p className="text-xs text-muted mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-medium mb-4">🎯 当前聚焦</h3>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge tone="ok">当前阶段</Badge>
                <span className="font-medium">采集阶段</span>
              </div>
              <p className="text-sm text-muted">聚焦类目：童装 / T恤</p>
              <p className="text-sm text-muted">目标市场：越南 Shopee、泰国 TikTok</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📊</span>
                <span className="font-medium">选品洞察</span>
              </div>
              <p className="text-sm text-muted">本周爆品：纯棉透气T恤</p>
              <p className="text-sm text-muted">转化率趋势：+24.5%</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⚡</span>
                <span className="font-medium">效率目标</span>
              </div>
              <p className="text-sm text-muted">日上架目标：500-800件</p>
              <p className="text-sm text-muted">当前进度：— / 500</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
