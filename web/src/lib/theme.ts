import { useSyncExternalStore } from 'react';

export type PresetThemeId = 'solarized' | 'cyberpunk' | 'jade' | 'sunset' | 'parchment';

export type ThemeId = PresetThemeId | 'custom';

export type ThemeOption = {
  id: ThemeId;
  label: string;
  description: string;
};

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'solarized',
    label: '阳光墨玉',
    description: 'Solarized Dark · 护眼编程色',
  },
  {
    id: 'cyberpunk',
    label: '赛博朋克',
    description: '霓虹青 + 黄顶栏',
  },
  {
    id: 'jade',
    label: '翡翠暗绿',
    description: '深邃墨绿 · 玉石质感',
  },
  {
    id: 'sunset',
    label: '落日橙黑',
    description: '高对比深灰 + 落日橙',
  },
  {
    id: 'parchment',
    label: '羊皮纸',
    description: '古籍手稿 · 琥珀棕墨色',
  },
  {
    id: 'custom',
    label: '自定义 CSS',
    description: '在下方编辑区编写配色（本机保存）',
  },
];

const STORAGE_KEY = 'psa_theme';
const CUSTOM_CSS_KEY = 'psa_theme_custom_css';
const STYLE_ID = 'psa-custom-theme';
const DEFAULT_THEME: ThemeId = 'jade';

const VALID_THEMES = new Set<string>(THEME_OPTIONS.map((o) => o.id));
const DEPRECATED_THEMES: Record<string, ThemeId> = {
  browser: 'jade',
  sunlight: 'parchment',
};

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
