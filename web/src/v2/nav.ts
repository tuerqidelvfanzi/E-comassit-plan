export type NavItem = { to: string; label: string; end?: boolean; badge?: string; icon?: string };

export type NavGroup = {
  title: string;
  icon: string;
  items: NavItem[];
};

/** V3.0 菜单配置 - 按功能模块分组 */
export const v3NavGroups: NavGroup[] = [
  {
    title: '选品中心',
    icon: '📊',
    items: [
      { to: '/app/competitors', label: '竞品分析', icon: '🔍' },
      { to: '/app/insights', label: '选品洞察', icon: '💡' },
    ],
  },
  {
    title: '采集中心',
    icon: '📦',
    items: [
      { to: '/app/inbox', label: '采集箱', icon: '📥' },
      { to: '/app/link-collect', label: '链接直采', icon: '🔗' },
      { to: '/app/batch-collect', label: '批量采集', icon: '⚡' },
    ],
  },
  {
    title: '工作台',
    icon: '⚙️',
    items: [
      { to: '/app', label: '处理管线', end: true, icon: '🔄' },
      { to: '/app/title-optimization', label: '标题优化', icon: '✏️' },
    ],
  },
  {
    title: '发布中心',
    icon: '🚀',
    items: [
      { to: '/app/publish', label: '发布队列', icon: '📤' },
    ],
  },
  {
    title: '配置中心',
    icon: '🛠️',
    items: [
      { to: '/app/templates', label: '类目模板', icon: '📋' },
      { to: '/app/rules', label: '规则库', icon: '📐' },
      { to: '/app/settings/themes', label: '主题风格', icon: '🎨' },
    ],
  },
  {
    title: '系统设置',
    icon: '⚡',
    items: [
      { to: '/app/integrations', label: '平台集成', icon: '🔌' },
      { to: '/app/settings', label: 'LLM配置', icon: '🤖' },
    ],
  },
];

/** 兼容旧版扁平菜单 */
export const v2NavItems: NavItem[] = v3NavGroups.flatMap(group => group.items);
