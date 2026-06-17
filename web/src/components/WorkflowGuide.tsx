import { Link } from 'react-router-dom';
import { Download, Globe, Inbox, PenLine, Send } from 'lucide-react';
import { downloadExtensionZip } from '../lib/extension';

type Step = {
  n: number;
  title: string;
  desc: string;
  icon: typeof Download;
  link?: { label: string; to: string };
  button?: { label: string; onClick: () => void };
};

const steps: Step[] = [
  {
    n: 1,
    title: '安装插件',
    desc: '在设置页点击「下载插件」，解压后于 Chrome 扩展程序页加载已解压项。',
    icon: Download,
    button: { label: '下载插件', onClick: downloadExtensionZip },
  },
  {
    n: 2,
    title: '登录目标网站并采集',
    desc: '打开 1688 / 淘宝等商品页，登录账号后点击插件「采集当前页」并上传到采集箱。',
    icon: Globe,
  },
  {
    n: 3,
    title: '回到后台采集箱编辑',
    desc: '在本站采集箱查看刚采集的商品，进入处理工作台做规则与 LLM 优化。',
    icon: Inbox,
    link: { label: '打开采集箱', to: '/app/inbox' },
  },
  {
    n: 4,
    title: '发布到各站草稿箱',
    desc: '处理完成后在发布中心创建任务，用插件在 Shopee / TikTok / 淘宝卖家后台填入草稿。',
    icon: PenLine,
    link: { label: '发布中心', to: '/app/publish' },
  },
  {
    n: 5,
    title: '在目标网站正式发布',
    desc: '登录对应平台卖家中心，检查草稿内容后点击平台内的「发布」完成上架。',
    icon: Send,
  },
];

export function WorkflowGuide({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'grid gap-2 sm:grid-cols-5' : 'grid gap-3 md:grid-cols-5'}>
      {steps.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.n}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-primary)]">
                {s.n}
              </span>
              <Icon className="h-4 w-4 text-[var(--color-primary)]" />
            </div>
            <p className="mt-2 text-sm font-medium">{s.title}</p>
            {!compact ? <p className="mt-1 text-xs text-muted leading-relaxed">{s.desc}</p> : null}
            {s.link ? (
              <div className="mt-2">
                <Link to={s.link.to} className="text-xs font-medium text-[var(--color-primary)] hover:underline">
                  {s.link.label} →
                </Link>
              </div>
            ) : null}
            {s.button ? (
              <div className="mt-2">
                <button
                  type="button"
                  className="text-xs font-medium text-[var(--color-primary)] hover:underline"
                  onClick={s.button.onClick}
                >
                  {s.button.label} →
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
