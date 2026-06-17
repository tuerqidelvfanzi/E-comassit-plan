import { Link } from "react-router-dom";
import { Card, Badge, Button } from "../components/ui";
import { WorkflowGuide } from "../components/WorkflowGuide";
import { ApiModeBanner } from "../components/ApiModeBanner";
import { downloadExtensionZip } from "../lib/extension";
import { useMetrics } from "../hooks/useAppQueries";
import { isDemoMode } from "../lib/demoConfig";

const QUICK_ACTIONS = [
  { icon: "\ud83d\udce5", label: "\u91c7\u96c6\u7bb1", desc: "1688/\u6dd8\u5b9d\u91c7\u96c6\u7ba1\u7406", to: "/app/inbox" },
  { icon: "\ud83d\udd17", label: "\u94fe\u63a5\u76f4\u91c7", desc: "\u4e00\u952e\u91c7\u96c6\u5546\u54c1\u8be6\u60c5", to: "/app/link-collect" },
  { icon: "\u2699\ufe0f", label: "\u5904\u7406\u5de5\u4f5c\u53f0", desc: "\u8fd0\u884c\u7ba1\u7ebf\u751f\u6210\u6807\u9898", to: "/app/inbox" },
  { icon: "\ud83d\ude80", label: "\u53d1\u5e03\u4e2d\u5fc3", desc: "Shopee/TikTok \u4e0a\u67b6", to: "/app/publish" },
];

const ACTIVITIES = [
  { time: "\u4eca\u5929 10:30", text: "\u4ece1688\u91c7\u96c6\u5546\u54c1\u300c\u97e9\u7248\u7ae5\u88c5\u8fde\u8863\u88d9\u300d" },
  { time: "\u4eca\u5929 10:25", text: "\u5904\u7406\u5546\u54c1\u300c\u513f\u7ae5\u7eaf\u68c9T\u6064\u300d\uff0c\u72b6\u6001\u66f4\u65b0" },
  { time: "\u4eca\u5929 09:50", text: "\u521b\u5efa\u53d1\u5e03\u4efb\u52a1\u300c\u5a74\u513f\u8fde\u4f53\u8863\u300d\u2192 Shopee\u8d8a\u5357" },
  { time: "\u6628\u5929 18:30", text: "\u5546\u54c1\u300c\u5973\u7ae5\u725b\u4ed4\u80cc\u5e26\u88e4\u300d\u5df2\u53d1\u5e03" },
  { time: "\u6628\u5929 15:20", text: "\u9009\u54c1\u6d1e\u5bdf\u5206\u6790\u5b8c\u6210\uff0c\u53d1\u73b03\u4e2a\u7206\u54c1" },
];

export function DashboardPage() {
  const { data: m, isLoading } = useMetrics();
  const demo = isDemoMode();
  const stat = (val: number | undefined, suffix = "") =>
    isLoading ? "\u2014" : (val ?? 0) + suffix;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-medium">v3.0</span>
            {demo && <span className="px-2.5 py-0.5 rounded-full bg-amber-400/30 text-xs font-medium">\u2728 \u6f14\u793a\u7248</span>}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">\u7535\u5546\u52a9\u624b</h1>
          <p className="mt-2 text-white/70 max-w-md">\u8de8\u5883\u7535\u5546\u5168\u6d41\u7a0b\u5de5\u4f5c\u53f0 \u2014 \u91c7\u96c6 \u2192 \u5904\u7406 \u2192 \u53d1\u5e03\uff0c\u4e00\u7ad9\u5f0f\u8fd0\u8425\u4e2d\u67a2</p>
          <div className="flex gap-3 mt-6">
            <Link to="/app/inbox">
              <Button className="bg-white text-indigo-700 hover:bg-white/90 font-medium shadow-lg">\u5f00\u59cb\u91c7\u96c6</Button>
            </Link>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={downloadExtensionZip}>\u4e0b\u8f7d\u63d2\u4ef6</Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "\u5f85\u5904\u7406", value: stat(m?.rawCount), sub: "\u672a\u5904\u7406\u5546\u54c1", color: "from-amber-50 to-orange-50 border-amber-200", icon: "\ud83d\udce6" },
          { label: "\u5904\u7406\u4e2d", value: stat(m?.processingCount), sub: "\u7ba1\u7ebf\u8fdb\u884c\u4e2d", color: "from-blue-50 to-sky-50 border-blue-200", icon: "\u2699\ufe0f" },
          { label: "\u5df2\u53d1\u5e03", value: stat(m?.publishedCount), sub: "\u5df2\u4e0a\u67b6\u5546\u54c1", color: "from-green-50 to-emerald-50 border-green-200", icon: "\u2705" },
          { label: "\u4eca\u65e5\u91c7\u96c6", value: stat(m ? Math.floor(m.rawCount * 0.3) : undefined), sub: "\u4eca\u65e5\u65b0\u589e", color: "from-purple-50 to-violet-50 border-purple-200", icon: "\u2601\ufe0f" },
        ].map((kpi) => (
          <Card key={kpi.label} className={"border bg-gradient-to-br " + kpi.color}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">{kpi.label}</span>
              <span className="text-xl">{kpi.icon}</span>
            </div>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1">{kpi.sub}</div>
          </Card>
        ))}
      </div>

      {/* Quick Actions + Workflow */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <h3 className="font-semibold mb-4">\u5feb\u901f\u5165\u53e3</h3>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.label} to={a.to} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-muted)] transition group">
                <span className="text-2xl group-hover:scale-110 transition">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{a.label}</div>
                  <div className="text-xs text-[var(--color-text-muted)] truncate">{a.desc}</div>
                </div>
                <span className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition">\u2192</span>
              </Link>
            ))}
          </div>
        </Card>

        {/* Workflow */}
        <Card className="lg:col-span-2">
          <h3 className="font-semibold mb-4">\u6807\u51c6\u4f5c\u4e1a\u6d41\u7a0b</h3>
          <WorkflowGuide />
        </Card>
      </div>

      {/* Activity Feed + Focus */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold mb-4">\u8fd1\u671f\u6d3b\u52a8</h3>
          <div className="space-y-4">
            {ACTIVITIES.map((a, i) => (
              <div key={i} className="flex gap-3">
                <div className="relative flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] mt-1.5" />
                  {i < ACTIVITIES.length - 1 && <div className="w-px flex-1 bg-[var(--color-border)] mt-1" />}
                </div>
                <div className="flex-1 pb-1">
                  <p className="text-sm">{a.text}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">\u5f53\u524d\u805a\u7126</h3>
          <div className="space-y-4">
            {[
              { title: "\u91c7\u96c6\u9636\u6bb5", desc: "\u7ae5\u88c5 / T\u6064\u7c7b\u76ee \u00b7 \u8d8a\u5357 Shopee \u00b7 \u6cf0\u56fd TikTok", icon: "\ud83c\udfaf" },
              { title: "\u9009\u54c1\u6d1e\u5bdf", desc: "\u672c\u5468\u7206\u54c1\uff1a\u7eaf\u68c9\u900f\u6c14T\u6064 \u00b7 \u8f6c\u5316\u7387 +24.5%", icon: "\ud83d\udcca" },
              { title: "\u6548\u7387\u76ee\u6807", desc: "\u65e5\u4e0a\u67b6\u76ee\u6807\uff1a500-800\u4ef6 \u00b7 \u5f53\u524d\u8fdb\u5ea6\uff1a\u2014 / 500", icon: "\u26a1" },
            ].map((item) => (
              <div key={item.title} className="p-4 rounded-xl bg-[var(--color-muted)]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium text-sm">{item.title}</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
