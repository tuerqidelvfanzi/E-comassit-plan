import { useSyncExternalStore } from 'react';

export type ThemeId = 'browser' | 'solarized' | 'cyberpunk';

export type ThemeOption = {
  id: ThemeId;
  label: string;
  description: string;
  preview: string[];
};

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'browser',
    label: '当前浏览器配置',
    description: '跟随系统浅色/深色偏好，保持默认蓝灰界面',
    preview: ['#f8fafc', '#ffffff', '#2563eb', '#64748b'],
  },
  {
    id: 'solarized',
    label: '阳光墨玉',
    description: 'Solarized Dark · 青墨底 + 蓝绿语法色，护眼阅读',
    preview: ['#002b36', '#073642', '#268bd2', '#859900'],
  },
  {
    id: 'cyberpunk',
    label: '赛博朋克',
    description: '深紫底 + 黄顶栏 + 霓虹青按钮，高对比工具风',
    preview: ['#0a0a12', '#12122a', '#00f0ff', '#fcee0a'],
  },
];

const STORAGE_KEY = 'psa_theme';

export function getStoredTheme(): ThemeId {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === 'browser' || raw === 'solarized' || raw === 'cyberpunk') return raw;
  return 'browser';
}

export function applyTheme(theme: ThemeId) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
  window.dispatchEvent(new Event('theme-change'));
}

export function initTheme() {
  applyTheme(getStoredTheme());

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystemChange = () => {
    if (getStoredTheme() === 'browser') {
      window.dispatchEvent(new Event('theme-change'));
    }
  };
  media.addEventListener('change', onSystemChange);
}

function subscribe(cb: () => void) {
  window.addEventListener('theme-change', cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener('theme-change', cb);
    window.removeEventListener('storage', cb);
  };
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getStoredTheme, () => 'browser' as ThemeId);

  return {
    theme,
    setTheme: applyTheme,
    options: THEME_OPTIONS,
  };
}
