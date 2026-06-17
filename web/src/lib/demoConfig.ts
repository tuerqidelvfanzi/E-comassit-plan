// Demo mode configuration
// Activated via VITE_DEMO_MODE=true env variable

export const isDemoMode = (): boolean => {
  return import.meta.env.VITE_DEMO_MODE === 'true';
};

import type { NavGroup } from '../v2/nav';

export const demoNavGroups: NavGroup[] = [
  { title: '采集中心', icon: '📦', items: [
    { to: '/app/inbox', label: '采集箱', icon: '📥' },
    { to: '/app/link-collect', label: '链接直采', icon: '🔗' },
  ]},
  { title: '工作台', icon: '⚙️', items: [
    { to: '/app', label: '处理管线', end: true, icon: '🔄' },
    { to: '/app/title-optimization', label: '标题优化', icon: '✏️' },
  ]},
  { title: '看板', icon: '📊', items: [
    { to: '/app/insights', label: '选品洞察', icon: '💡' },
    { to: '/app/publish', label: '发布队列', icon: '📤' },
  ]},
  { title: '配置', icon: '🔧', items: [
    { to: '/app/templates', label: '类目模板', icon: '📋' },
    { to: '/app/settings/themes', label: '主题风格', icon: '🎨' },
  ]},
  { title: '系统', icon: '⚡', items: [
    { to: '/app/settings', label: 'LLM配置', icon: '🤖' },
  ]},
];

export const DEMO_ROUTES = new Set([
  '/', '/app', '/app/inbox', '/app/link-collect',
  '/app/insights', '/app/publish', '/app/title-optimization',
  '/app/templates', '/app/settings/themes', '/app/settings',
  '/login', '/register',
]);
