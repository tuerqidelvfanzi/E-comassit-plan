export type NavItem = { to: string; label: string; end?: boolean; badge?: string; icon?: string };

export type NavGroup = {
  title: string;
  icon: string;
  items: NavItem[];
};

/**
 * V3.0 菜单配置 - 当前展示范围 = 会议 12:00-17:00 共识
 *
 * 核心三大功能：
 *   1. 选品（plugin → 采集 → 后端 Skill 分析 → 选品报告）
 *   2. 标题优化（导入表格 → 预设规则 → 输出上架标题）
 *   3. 竞品分析（输入商品链接 → 自动分析 → 输出结论）
 *
 * 支撑功能：Dashboard / 采集箱 / 链接直采 / 批量采集
 *
 * 其他功能（工作台、发布、模板、规则、设置、主题、标题 V2、集成、团队）
 * 当前阶段隐去，路由保留供后续迭代。
 */
export const v3NavGroups: NavGroup[] = [
  {
    title: '工作台',
    icon: '🏠',
    items: [
      { to: '/app', label: '总览', end: true, icon: '🏠' },
    ],
  },
  {
    title: '选品中心',
    icon: '📊',
    items: [
      { to: '/app/insights', label: '选品', icon: '🎯' },
      { to: '/app/competitors', label: '竞品分析', icon: '🔍' },
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
    title: '处理中心',
    icon: '✏️',
    items: [
      { to: '/app/title-optimization', label: '标题优化', icon: '✏️' },
    ],
  },
];

/** 兼容旧版扁平菜单 */
export const v2NavItems: NavItem[] = v3NavGroups.flatMap(group => group.items);