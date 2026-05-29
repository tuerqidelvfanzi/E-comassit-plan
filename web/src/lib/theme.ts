import { useSyncExternalStore } from 'react';

export type PresetThemeId =
  | 'browser'
  | 'solarized'
  | 'cyberpunk'
  | 'jade'
  | 'sunlight'
  | 'sunset'
  | 'parchment';

export type ThemeId = PresetThemeId | 'custom';

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
    description: '跟随系统浅色/深色偏好',
    preview: ['#f8fafc', '#ffffff', '#2563eb', '#64748b'],
  },
  {
    id: 'solarized',
    label: '阳光墨玉',
    description: 'Solarized Dark · 护眼编程色',
    preview: ['#002b36', '#073642', '#268bd2', '#859900'],
  },
  {
    id: 'cyberpunk',
    label: '赛博朋克',
    description: '霓虹青 + 黄顶栏',
    preview: ['#0a0a12', '#12122a', '#00f0ff', '#fcee0a'],
  },
  {
    id: 'jade',
    label: '翡翠暗绿',
    description: '深邃墨绿 · 玉石质感',
    preview: ['#051f18', '#0b2e24', '#34d399', '#a7f3d0'],
  },
  {
    id: 'sunlight',
    label: '日光暖白',
    description: '暖米纸感 · 阅读舒适',
    preview: ['#fffbeb', '#ffffff', '#f59e0b', '#78350f'],
  },
  {
    id: 'sunset',
    label: '落日橙黑',
    description: '高对比深灰 + 落日橙',
    preview: ['#121212', '#1e1e1e', '#ff5722', '#e5e5e5'],
  },
  {
    id: 'parchment',
    label: '羊皮纸',
    description: '古籍手稿 · 琥珀棕墨色',
    preview: ['#f4e4be', '#f7eac9', '#a3682c', '#5f4b32'],
  },
  {
    id: 'custom',
    label: '自定义 CSS',
    description: '在下方编辑区编写配色（本机保存）',
    preview: ['#f8fafc', '#e2e8f0', '#6366f1', '#0f172a'],
  },
];

const STORAGE_KEY = 'psa_theme';
const CUSTOM_CSS_KEY = 'psa_theme_custom_css';
const STYLE_ID = 'psa-custom-theme';

const VALID_THEMES = new Set<string>(THEME_OPTIONS.map((o) => o.id));

/** 自定义主题模板：覆盖语义变量即可生效 */
export const DEFAULT_CUSTOM_CSS = `/* 自定义主题 — 在 :root[data-theme='custom'] 下定义变量 */
:root[data-theme='custom'] {
  --color-bg: #f8fafc;
  --color-bg-gradient-from: #f8fafc;
  --color-bg-gradient-to: #eff6ff;
  --color-surface: #ffffff;
  --color-muted: #f1f5f9;
  --color-text: #0f172a;
  --color-text-muted: #64748b;
  --color-text-label: #475569;
  --color-border: #e2e8f0;
  --color-primary: #2563eb;
  --color-primary-fg: #ffffff;
  --color-primary-soft: rgba(37, 99, 235, 0.12);
  --color-topbar: #ffffff;
  --color-topbar-fg: #0f172a;
  --color-nav-accent: #2563eb;
  --color-success: #059669;
  --color-warn: #d97706;
  --color-danger: #dc2626;
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* 也可写额外规则，例如： */
/*
body { font-family: Georgia, serif; }
*/
`;

export function getStoredTheme(): ThemeId {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw && VALID_THEMES.has(raw)) return raw as ThemeId;
  return 'browser';
}

export function getCustomCss(): string {
  return localStorage.getItem(CUSTOM_CSS_KEY) ?? DEFAULT_CUSTOM_CSS;
}

export function saveCustomCss(css: string) {
  localStorage.setItem(CUSTOM_CSS_KEY, css);
}

function injectCustomCss(css: string) {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = css;
}

function removeCustomCss() {
  document.getElementById(STYLE_ID)?.remove();
}

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

export function initTheme() {
  const theme = getStoredTheme();
  document.documentElement.setAttribute('data-theme', theme);
  if (theme === 'custom') {
    injectCustomCss(getCustomCss());
  }

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', () => {
    if (getStoredTheme() === 'browser') {
      window.dispatchEvent(new Event('theme-change'));
    }
  });
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
    customCss: useSyncExternalStore(subscribe, getCustomCss, () => DEFAULT_CUSTOM_CSS),
    applyCustomCss: applyCustomThemeCss,
    resetCustomCss: () => applyCustomThemeCss(DEFAULT_CUSTOM_CSS),
  };
}
