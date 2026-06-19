import { Link } from "react-router-dom";
import { Card, Badge, Button } from "../components/ui";
import { WorkflowGuide } from "../components/WorkflowGuide";
import { ApiModeBanner } from "../components/ApiModeBanner";
import { downloadExtensionZip } from "../lib/extension";
import { useMetrics } from "../hooks/useAppQueries";
import { isDemoMode } from "../lib/demoConfig";

// \u5f53\u524d\u5c55\u793a\u8303\u56f4\uff08\u4f1a\u8bae 12:00-17:00 \u5171\u8bc6\uff09\uff1a
// 3 \u5927\u6838\u5fc3\uff1a\u9009\u54c1 / \u6807\u9898\u4f18\u5316 / \u7ade\u54c1\u5206\u6790\uff1b\u652f\u6491\uff1a\u91c7\u96c6\u7bb1 / \u94fe\u63a5\u76f4\u91c7 / \u6279\u91cf\u91c7\u96c6
const QUICK_ACTIONS = [
  { icon: "\ud83c\udfaf", label: "\u9009\u54c1", desc: "\u63d2\u4ef6\u91c7\u96c6 \u2192 Skill \u5206\u6790 \u2192 \u9009\u54c1\u62a5\u544a", to: "/app/insights" },
  { icon: "\ud83d\udd0d", label: "\u7ade\u54c1\u5206\u6790", desc: "\u8f93\u5165\u94fe\u63a5 \u2192 \u81ea\u52a8\u5206\u6790 \u2192 \u8f93\u51fa\u7ed3\u8bba", to: "/app/competitors" },
  { icon: "\u270f\ufe0f", label: "\u6807\u9898\u4f18\u5316", desc: "\u5bfc\u5165\u8868\u683c \u2192 \u9884\u8bbe\u89c4\u5219 \u2192 \u4e0a\u67b6\u6807\u9898", to: "/app/title-optimization" },
  { icon: "\ud83d\udce5", label: "\u91c7\u96c6\u7bb1", desc: "\u63d2\u4ef6/\u94fe\u63a5/\u6279\u91cf\u91c7\u96c6\u5546\u54c1", to: "/app/inbox" },
  { icon: "\ud83d\udd17", label: "\u94fe\u63a5\u76f4\u91c7", desc: "\u7c98\u8d34\u5546\u54c1\u94fe\u63a5\u4e00\u952e\u91c7\u96c6", to: "/app/link-collect" },
  { icon: "\u26a1", label: "\u6279\u91cf\u91c7\u96c6", desc: "\u699c\u5355/\u641c\u7d22\u9875\u6279\u91cf\u5165\u5e93", to: "/app/batch-collect" },
];

const ACTIVITIES = [
  { time: "\u4eca\u5929 10:30", text: "\u63d2\u4ef6\u91c7\u96c6\u300c\u97e9\u7248\u7ae5\u88c5\u8fde\u8863\u88d9\u300d\u5165\u91c7\u96c6\u7bb1" },
  { time: "\u4eca\u5929 10:25", text: "\u9009\u54c1 Skill \u5206\u6790\u5b8c\u6210\uff0c\u53d1\u6398 3 \u6b3e\u503c\u5f97\u63a8\u5e7f\u5019\u9009" },
  { time: "\u4eca\u5929 09:50", text: "\u6807\u9898\u4f18\u5316\uff1a\u5bfc\u5165 50 \u884c \u2192 \u8f93\u51fa 48 \u6761\u4e0a\u67b6\u6807\u9898" },
  { time: "\u6628\u5929 18:30", text: "\u7ade\u54c1\u5206\u6790\uff1a\u8f93\u5165\u6dd8\u5b9d\u5546\u54c1\u94fe\u63a5 \u2192 \u8f93\u51fa\u7ed3\u8bba\u62a5\u544a" },
  { time: "\u6628\u5929 15:20", text: "\u6279\u91cf\u91c7\u96c6\u300c\u7ae5\u88c5 TOP \u699c\u300d30 \u6b3e\u5165\u91c7\u96c6\u7bb1" },
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
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-medium">v3.0 \u00b7 MVP \u8303\u56f4</span>
            {demo && <span className="px-2.5 py-0.5 rounded-full bg-amber-400/30 text-xs font-medium">\u2728 \u6f14\u793a\u7248</span>}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">\u7535\u5546\u52a9\u624b</h1>
          <p className="mt-2 text-white/70 max-w-md">\u5f53\u524d\u5c55\u793a\u8303\u56f4\uff1a\u9009\u54c1 \u00b7 \u7ade\u54c1\u5206\u6790 \u00b7 \u6807\u9898\u4f18\u5316 \u2014 \u63d2\u4ef6\u91c7\u96c6 \u2192 \u540e\u7aef Skill \u5206\u6790 \u2192 \u62a5\u544a\u8f93\u51fa</p>
          <div className="flex gap-3 mt-6">
            <Link to="/app/insights">
              <Button className="bg-white text-indigo-700 hover:bg-white/90 font-medium shadow-lg">\u5f00\u59cb\u9009\u54c1</Button>
            </Link>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={downloadExtensionZip}>\u4e0b\u8f7d\u63d2\u4ef6</Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "\u91c7\u96c6\u7bb1", value: stat(m?.rawCount), sub: "\u5df2\u91c7\u96c6\u5546\u54c1", color: "from-amber-50 to-orange-50 border-amber-200", icon: "\ud83d\udce6" },
          { label: "\u9009\u54c1\u5019\u9009", value: stat(m?.processingCount), sub: "Skill \u5206\u6790\u4e2d", color: "from-blue-50 to-sky-50 border-blue-200", icon: "\ud83c\udfaf" },
          { label: "\u4eca\u65e5\u65b0\u589e", value: stat(m ? Math.floor(m.rawCount * 0.3) : undefined), sub: "\u4eca\u65e5\u91c7\u96c6", color: "from-purple-50 to-violet-50 border-purple-200", icon: "\u2601\ufe0f" },
          { label: "\u503c\u5f97\u63a8\u5e7f", value: stat(m?.publishedCount), sub: "\u9009\u54c1\u7ed3\u8bba\u547d\u4e2d", color: "from-green-50 to-emerald-50 border-green-200", icon: "\u2705" },
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
              { title: "\u9009\u54c1", desc: "\u7ae5\u88c5 / T\u6064\u7c7b\u76ee \u00b7 \u540e\u7aef Skill \u5206\u6790 \u00b7 \u8f93\u51fa\u503c\u5f97\u63a8\u5e7f\u5019\u9009", icon: "\ud83c\udfaf" },
              { title: "\u6807\u9898\u4f18\u5316", desc: "\u5bfc\u5165\u8868\u683c \u2192 \u9884\u8bbe\u89c4\u5219\uff08\u53bb\u5e9f\u8bcd / \u8865\u70ed\u641c\uff09\u2192 \u4e0a\u67b6\u6807\u9898", icon: "\u270f\ufe0f" },
              { title: "\u7ade\u54c1\u5206\u6790", desc: "\u8f93\u5165\u5546\u54c1\u94fe\u63a5 \u2192 \u81ea\u52a8\u5206\u6790 \u2192 \u8f93\u51fa\u7ed3\u8bba", icon: "\ud83d\udd0d" },
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
