// Demo mode configuration
// Activated via VITE_DEMO_MODE=true env variable

export const isDemoMode = (): boolean => {
  return import.meta.env.VITE_DEMO_MODE === 'true';
};

import type { NavGroup } from '../v2/nav';

/**
 * 演示模式菜单 - 与 v3NavGroups 保持一致的范围：
 * 3 大核心功能（选品/竞品分析/标题优化）+ 支撑功能（采集箱/链接直采/批量采集/Dashboard）
 */
export const demoNavGroups: NavGroup[] = [
  { title: '工作台', icon: '🏠', items: [
    { to: '/app', label: '总览', end: true, icon: '🏠' },
  ]},
  { title: '选品中心', icon: '📊', items: [
    { to: '/app/insights', label: '选品', icon: '🎯' },
    { to: '/app/competitors', label: '竞品分析', icon: '🔍' },
  ]},
  { title: '采集中心', icon: '📦', items: [
    { to: '/app/inbox', label: '采集箱', icon: '📥' },
    { to: '/app/link-collect', label: '链接直采', icon: '🔗' },
    { to: '/app/batch-collect', label: '批量采集', icon: '⚡' },
  ]},
  { title: '处理中心', icon: '✏️', items: [
    { to: '/app/title-optimization', label: '标题优化', icon: '✏️' },
  ]},
];

export const DEMO_ROUTES = new Set([
  '/', '/app',
  '/app/insights', '/app/competitors',
  '/app/inbox', '/app/link-collect', '/app/batch-collect',
  '/app/title-optimization',
  '/login', '/register',
]);