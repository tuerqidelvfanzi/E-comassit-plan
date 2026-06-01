import { useSyncExternalStore } from 'react';

export type ThemeCategory = 'light' | 'dark' | 'tech' | 'retro';

export type PresetThemeId =
  | 'browser' | 'solarized' | 'cyberpunk' | 'jade' | 'sunset' | 'parchment'
  | 'minimal-white' | 'dracula' | 'tokyo-night' | 'nord' | 'vaporwave';

export type ThemeId = PresetThemeId | 'custom';

export type ThemeOption = {
  id: ThemeId;
  label: string;
  category: ThemeCategory;
};

export const THEME_CATEGORIES: { id: ThemeCategory; label: string }[] = [
  { id: 'light', label: '浅色' },
  { id: 'dark', label: '深色' },
  { id: 'tech', label: '科技' },
  { id: 'retro', label: '复古' },
];

/** 主题选项 - 与 themes.css 中的 data-theme 值对应 */
export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'browser', label: '跟随系统', category: 'light' },
  { id: 'minimal-white', label: '极简白', category: 'light' },
  { id: 'dracula', label: '德古拉紫', category: 'dark' },
  { id: 'tokyo-night', label: '东京夜景', category: 'dark' },
  { id: 'nord', label: '北欧极简', category: 'dark' },
  { id: 'jade', label: '翡翠暗绿', category: 'dark' },
  { id: 'sunset', label: '落日橙黑', category: 'dark' },
  { id: 'vaporwave', label: '蒸汽波', category: 'retro' },
  { id: 'solarized', label: '阳光墨玉', category: 'dark' },
  { id: 'cyberpunk', label: '赛博朋克', category: 'tech' },
  { id: 'parchment', label: '羊皮纸', category: 'retro' },
  { id: 'custom', label: '自定义 CSS', category: 'light' },
];

const VALID_THEMES = new Set<string>(THEME_OPTIONS.map((o) => o.id));
const DEPRECATED_THEMES: Record<string, ThemeId> = {
  sunlight: 'parchment',
};
const DEFAULT_THEME: ThemeId = 'jade';

const STORAGE_KEY = 'psa_theme';
const CUSTOM_CSS_KEY = 'psa_theme_custom_css';
const CUSTOM_STYLE_ID = 'psa-custom-theme';

export const DEFAULT_CUSTOM_CSS = `/* 自定义主题 - 在 :root[data-theme='custom'] 下覆盖 CSS 变量 */
:root[data-theme='custom'] {
  --color-bg: #f8fafc;
  --color-bg-soft: #f1f5f9;
  --color-surface: #ffffff;
  --color-surface-2: #f1f5f9;
  --color-muted: #e2e8f0;
  --color-text: #0f172a;
  --color-text-2: #475569;
  --color-text-3: #94a3b8;
  --color-border: #e2e8f0;
  --color-primary: #2563eb;
  --color-primary-fg: #ffffff;
  --color-primary-soft: rgba(37, 99, 235, 0.1);
  --color-topbar: #ffffff;
  --color-topbar-fg: #0f172a;
  --color-nav-accent: #2563eb;
  --color-success: #059669;
  --color-warn: #d97706;
  --color-danger: #dc2626;
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.08);
  --radius: 8px;
}
`;

function normalizeTheme(raw: string | null): ThemeId {
  if (raw && VALID_THEMES.has(raw)) return raw as ThemeId;
  if (raw && raw in DEPRECATED_THEMES) return DEPRECATED_THEMES[raw];
  return DEFAULT_THEME;
}

export function getStoredTheme(): ThemeId {
  return normalizeTheme(localStorage.getItem(STORAGE_KEY));
}

export function getCustomCss(): string {
  return localStorage.getItem(CUSTOM_CSS_KEY) ?? DEFAULT_CUSTOM_CSS;
}

export function saveCustomCss(css: string) {
  localStorage.setItem(CUSTOM_CSS_KEY, css);
}

function injectCustomCss(css: string) {
  let el = document.getElementById(CUSTOM_STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = CUSTOM_STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = css;
}

function removeCustomCss() {
  document.getElementById(CUSTOM_STYLE_ID)?.remove();
}

/** 应用主题 - 只设置 data-theme 属性，样式由 themes.css 处理 */
export function applyTheme(theme: ThemeId) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);

  if (theme === 'custom') {
    injectCustomCss(getCustomCss());
  } else {
    removeCustomCss();
  }

  window.dispatchEvent(new Event('theme-change'));
}

export function applyCustomThemeCss(css: string) {
  saveCustomCss(css);
  applyTheme('custom');
}

/** 初始化主题 - 从 localStorage 读取并应用 */
export function initTheme() {
  const theme = getStoredTheme();
  document.documentElement.setAttribute('data-theme', theme);

  if (theme === 'custom') {
    injectCustomCss(getCustomCss());
  }
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
  const theme = useSyncExternalStore(subscribe, getStoredTheme, () => DEFAULT_THEME);

  return {
    theme,
    setTheme: applyTheme,
    options: THEME_OPTIONS,
    customCss: useSyncExternalStore(subscribe, getCustomCss, () => DEFAULT_CUSTOM_CSS),
    applyCustomCss: applyCustomThemeCss,
    resetCustomCss: () => applyCustomThemeCss(DEFAULT_CUSTOM_CSS),
  };
}
