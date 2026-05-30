export type NavItem = { to: string; label: string; end?: boolean; badge?: string };

export const v2NavItems: NavItem[] = [
  { to: '/app', label: '工作台', end: true },
  { to: '/app/competitors', label: '竞品分析', badge: 'v2.1' },
  { to: '/app/inbox', label: '采集箱' },
  { to: '/app/link-collect', label: '链接直采', badge: 'v2.2' },
  { to: '/app/batch-collect', label: '批量采集', badge: 'v2.2' },
  { to: '/app/templates', label: '类目模板' },
  { to: '/app/rules', label: '规则库' },
  { to: '/app/insights', label: '选品洞察' },
  { to: '/app/publish', label: '发布中心' },
  { to: '/app/integrations', label: '平台集成', badge: 'v2.3' },
  { to: '/app/team', label: '团队', badge: 'v2.3' },
  { to: '/app/settings', label: '设置' },
];
