import { useSyncExternalStore } from 'react';

export type ThemeCategory = 'light' | 'dark' | 'tech' | 'retro';

export type PresetThemeId =
  // 浅色系
  | 'minimal-white' | 'editorial-serif' | 'soft-pastel' | 'corporate-clean'
  | 'academic-paper' | 'swiss-grid' | 'xiaohongshu-white' | 'sharp-mono'
  | 'magazine-bold' | 'engineering-whiteprint' | 'news-broadcast' | 'solarized-light'
  | 'catppuccin-latte' | 'arctic-cool' | 'sunset-warm' | 'memphis-pop' | 'bauhaus'
  | 'midcentury' | 'rainbow-gradient'
  // 深色系
  | 'dracula' | 'tokyo-night' | 'nord' | 'catppuccin-mocha' | 'gruvbox-dark'
  | 'rose-pine' | 'terminal-green' | 'glassmorphism' | 'aurora' | 'pitch-deck-vc'
  // 科技感
  | 'cyberpunk-neon' | 'blueprint' | 'y2k-chrome' | 'neo-brutalism'
  // 复古风
  | 'vaporwave' | 'retro-tv' | 'japanese-minimal'
  // 兼容旧ID
  | 'solarized' | 'cyberpunk' | 'jade' | 'sunset' | 'parchment';

export type ThemeId = PresetThemeId | 'custom';

/** 主题选项（含分类） */
export type ThemeOption = {
  id: ThemeId;
  label: string;
  labelEn?: string;
  description: string;
  category: ThemeCategory;
  /** 主题预览色块 */
  preview: {
    bg: string;
    surface: string;
    accent: string;
    accent2: string;
  };
};

export const THEME_CATEGORIES: { id: ThemeCategory; label: string; labelEn: string }[] = [
  { id: 'light', label: '浅色系', labelEn: 'Light' },
  { id: 'dark', label: '深色系', labelEn: 'Dark' },
  { id: 'tech', label: '科技感', labelEn: 'Tech' },
  { id: 'retro', label: '复古风', labelEn: 'Retro' },
];

export const THEME_OPTIONS: ThemeOption[] = [
  // ============ 浅色系 ============
  {
    id: 'minimal-white',
    label: '极简白',
    labelEn: 'Minimal White',
    description: 'clean restraint · 克制高级',
    category: 'light',
    preview: { bg: '#ffffff', surface: '#f8fafc', accent: '#2563eb', accent2: '#64748b' },
  },
  {
    id: 'editorial-serif',
    label: '杂志衬线',
    labelEn: 'Editorial Serif',
    description: 'high editorial · 高级杂志风',
    category: 'light',
    preview: { bg: '#faf8f5', surface: '#ffffff', accent: '#1a1a1a', accent2: '#6b6b6b' },
  },
  {
    id: 'soft-pastel',
    label: '马卡龙',
    labelEn: 'Soft Pastel',
    description: '柔和马卡龙 · 温柔粉嫩',
    category: 'light',
    preview: { bg: '#fef7f0', surface: '#ffffff', accent: '#f472b6', accent2: '#a78bfa' },
  },
  {
    id: 'corporate-clean',
    label: '企业商务',
    labelEn: 'Corporate Clean',
    description: '专业商务 · 蓝黑配色',
    category: 'light',
    preview: { bg: '#f1f5f9', surface: '#ffffff', accent: '#1e40af', accent2: '#334155' },
  },
  {
    id: 'academic-paper',
    label: '学术白皮书',
    labelEn: 'Academic Paper',
    description: '学术论文 · 简洁严谨',
    category: 'light',
    preview: { bg: '#ffffff', surface: '#fafafa', accent: '#1f2937', accent2: '#6b7280' },
  },
  {
    id: 'swiss-grid',
    label: '瑞士网格',
    labelEn: 'Swiss Grid',
    description: 'Helvetica感 · 极简红黑',
    category: 'light',
    preview: { bg: '#ffffff', surface: '#f5f5f5', accent: '#dc2626', accent2: '#000000' },
  },
  {
    id: 'xiaohongshu-white',
    label: '小红书白底',
    labelEn: 'XiaoHongShu',
    description: '小红书风格 · 高级感',
    category: 'light',
    preview: { bg: '#fffdfb', surface: '#ffffff', accent: '#ff2742', accent2: '#ff7a90' },
  },
  {
    id: 'sharp-mono',
    label: '黑白高对比',
    labelEn: 'Sharp Mono',
    description: '黑白分明 · 锐利衬线',
    category: 'light',
    preview: { bg: '#ffffff', surface: '#f0f0f0', accent: '#000000', accent2: '#404040' },
  },
  {
    id: 'magazine-bold',
    label: '大字杂志',
    labelEn: 'Magazine Bold',
    description: '120px大字标题 · 冲击力',
    category: 'light',
    preview: { bg: '#ffffff', surface: '#1a1a1a', accent: '#ff0000', accent2: '#ff6b00' },
  },
  {
    id: 'engineering-whiteprint',
    label: '工程白图',
    labelEn: 'Engineering',
    description: '蓝图风格 · 工程图纸',
    category: 'light',
    preview: { bg: '#ffffff', surface: '#e0f2fe', accent: '#0ea5e9', accent2: '#1e40af' },
  },
  {
    id: 'news-broadcast',
    label: '新闻播报',
    labelEn: 'News Broadcast',
    description: '红白新闻风 · 大字标题',
    category: 'light',
    preview: { bg: '#ffffff', surface: '#dc2626', accent: '#1e3a8a', accent2: '#fbbf24' },
  },
  {
    id: 'solarized-light',
    label: '阳光墨玉',
    labelEn: 'Solarized Light',
    description: '护眼暖黄 · 经典编程色',
    category: 'light',
    preview: { bg: '#fdf6e3', surface: '#eee8d5', accent: '#657b83', accent2: '#93a1a1' },
  },
  {
    id: 'catppuccin-latte',
    label: 'Catppuccin Latte',
    labelEn: 'Catppuccin Latte',
    description: '咖啡拿铁 · 温暖浅色',
    category: 'light',
    preview: { bg: '#eff1f5', surface: '#ccd0da', accent: '#7287fd', accent2: '#ea76c4' },
  },
  {
    id: 'arctic-cool',
    label: '冷色调',
    labelEn: 'Arctic Cool',
    description: '蓝青冷色 · 冷静专业',
    category: 'light',
    preview: { bg: '#f0f9ff', surface: '#bae6fd', accent: '#0891b2', accent2: '#0284c7' },
  },
  {
    id: 'sunset-warm',
    label: '暖色调',
    labelEn: 'Sunset Warm',
    description: '橘珊瑚琥珀 · 温暖舒适',
    category: 'light',
    preview: { bg: '#fffbf5', surface: '#fed7aa', accent: '#ea580c', accent2: '#f59e0b' },
  },
  {
    id: 'memphis-pop',
    label: '孟菲斯波普',
    labelEn: 'Memphis Pop',
    description: '几何图案 · 活泼创意',
    category: 'light',
    preview: { bg: '#ffffff', surface: '#fef3c7', accent: '#8b5cf6', accent2: '#f472b6' },
  },
  {
    id: 'bauhaus',
    label: '包豪斯几何',
    labelEn: 'Bauhaus',
    description: '红黄蓝原色 · 极简几何',
    category: 'light',
    preview: { bg: '#ffffff', surface: '#fef9c3', accent: '#dc2626', accent2: '#2563eb' },
  },
  {
    id: 'midcentury',
    label: '世纪中期',
    labelEn: 'Mid-Century',
    description: '复古现代 · 棕绿配色',
    category: 'light',
    preview: { bg: '#fefce8', surface: '#d9f99d', accent: '#65a30d', accent2: '#92400e' },
  },
  {
    id: 'rainbow-gradient',
    label: '彩虹渐变',
    labelEn: 'Rainbow Gradient',
    description: '彩虹点缀 · 活力多彩',
    category: 'light',
    preview: { bg: '#ffffff', surface: '#fdf4ff', accent: '#c026d3', accent2: '#0891b2' },
  },

  // ============ 深色系 ============
  {
    id: 'dracula',
    label: '德古拉紫',
    labelEn: 'Dracula',
    description: '经典紫红 · 程序员最爱',
    category: 'dark',
    preview: { bg: '#282a36', surface: '#44475a', accent: '#ff79c6', accent2: '#bd93f9' },
  },
  {
    id: 'tokyo-night',
    label: '东京夜景',
    labelEn: 'Tokyo Night',
    description: '日式深蓝 · 赛博朋克前身',
    category: 'dark',
    preview: { bg: '#1a1b26', surface: '#24283b', accent: '#7aa2f7', accent2: '#bb9af7' },
  },
  {
    id: 'nord',
    label: '北欧极简',
    labelEn: 'Nord',
    description: 'nordic cool · 冷淡高级',
    category: 'dark',
    preview: { bg: '#2e3440', surface: '#3b4252', accent: '#88c0d0', accent2: '#81a1c1' },
  },
  {
    id: 'catppuccin-mocha',
    label: 'Catppuccin Mocha',
    labelEn: 'Catppuccin Mocha',
    description: '摩卡深色 · 温暖紫调',
    category: 'dark',
    preview: { bg: '#1e1e2e', surface: '#313244', accent: '#cba6f7', accent2: '#f38ba8' },
  },
  {
    id: 'gruvbox-dark',
    label: 'Gruvbox Dark',
    labelEn: 'Gruvbox Dark',
    description: '复古暖色 · 高对比暗色',
    category: 'dark',
    preview: { bg: '#282828', surface: '#3c3836', accent: '#fb4934', accent2: '#fabd2f' },
  },
  {
    id: 'rose-pine',
    label: '玫瑰松石',
    labelEn: 'Rose Pine',
    description: '粉紫配色 · 温柔暗色',
    category: 'dark',
    preview: { bg: '#191724', surface: '#26233a', accent: '#c4a7e7', accent2: '#f6c177' },
  },
  {
    id: 'terminal-green',
    label: '绿屏终端',
    labelEn: 'Terminal Green',
    description: '经典绿屏 · 复古终端',
    category: 'dark',
    preview: { bg: '#0a0a0a', surface: '#1a1a1a', accent: '#00ff00', accent2: '#00cc00' },
  },
  {
    id: 'glassmorphism',
    label: '毛玻璃',
    labelEn: 'Glassmorphism',
    description: '透明毛玻璃 · 梦幻质感',
    category: 'dark',
    preview: { bg: 'rgba(30,30,50,0.8)', surface: 'rgba(255,255,255,0.1)', accent: '#60a5fa', accent2: '#a78bfa' },
  },
  {
    id: 'aurora',
    label: '极光渐变',
    labelEn: 'Aurora',
    description: '北欧极光 · 流光溢彩',
    category: 'dark',
    preview: { bg: '#0f172a', surface: '#1e293b', accent: '#10b981', accent2: '#8b5cf6' },
  },
  {
    id: 'pitch-deck-vc',
    label: 'VC融资风',
    labelEn: 'Pitch Deck VC',
    description: 'YC风融资 · 渐变蓝紫',
    category: 'dark',
    preview: { bg: '#0f0f23', surface: '#1a1a3e', accent: '#6366f1', accent2: '#8b5cf6' },
  },

  // ============ 科技感 ============
  {
    id: 'cyberpunk-neon',
    label: '赛博霓虹',
    labelEn: 'Cyberpunk Neon',
    description: '霓虹粉青 · 赛博朋克',
    category: 'tech',
    preview: { bg: '#0d0221', surface: '#1a0a3e', accent: '#ff00ff', accent2: '#00ffff' },
  },
  {
    id: 'blueprint',
    label: '蓝图工程',
    labelEn: 'Blueprint',
    description: '蓝色网格 · 工程图纸',
    category: 'tech',
    preview: { bg: '#0c2d48', surface: '#145374', accent: '#2e8bc0', accent2: '#b1d4e0' },
  },
  {
    id: 'y2k-chrome',
    label: 'Y2K镜面',
    labelEn: 'Y2K Chrome',
    description: '千禧银色 · 铬金属质感',
    category: 'tech',
    preview: { bg: '#dfe4ec', surface: 'rgba(255,255,255,0.72)', accent: '#8a5cff', accent2: '#3ccfd8' },
  },
  {
    id: 'neo-brutalism',
    label: '新粗野主义',
    labelEn: 'Neo-Brutalism',
    description: '厚描边硬阴影 · 明黄点缀',
    category: 'tech',
    preview: { bg: '#ffffff', surface: '#ffff00', accent: '#000000', accent2: '#ff0000' },
  },

  // ============ 复古风 ============
  {
    id: 'vaporwave',
    label: '蒸汽波',
    labelEn: 'Vaporwave',
    description: '粉紫渐变 · 复古未来',
    category: 'retro',
    preview: { bg: '#1a0a2e', surface: '#2d1b4e', accent: '#ff71ce', accent2: '#01cdfe' },
  },
  {
    id: 'retro-tv',
    label: 'CRT扫描线',
    labelEn: 'Retro TV CRT',
    description: '复古显像管 · 暖黄扫描线',
    category: 'retro',
    preview: { bg: '#2d2d2d', surface: '#3d3d3d', accent: '#ffd93d', accent2: '#6bcb77' },
  },
  {
    id: 'japanese-minimal',
    label: '和风极简',
    labelEn: 'Japanese Minimal',
    description: '朱红点缀 · 日式侘寂',
    category: 'retro',
    preview: { bg: '#faf9f6', surface: '#ffffff', accent: '#c41e3a', accent2: '#2c2c2c' },
  },

  // ============ 兼容旧ID ============
  {
    id: 'jade',
    label: '翡翠暗绿',
    labelEn: 'Jade',
    description: '深邃墨绿 · 玉石质感',
    category: 'dark',
    preview: { bg: '#0f1f1a', surface: '#1a3d2e', accent: '#10b981', accent2: '#6ee7b7' },
  },
  {
    id: 'sunset',
    label: '落日橙黑',
    labelEn: 'Sunset',
    description: '高对比深灰 + 落日橙',
    category: 'dark',
    preview: { bg: '#1a1a1a', surface: '#2d2d2d', accent: '#f97316', accent2: '#fbbf24' },
  },

  // ============ 自定义 ============
  {
    id: 'custom',
    label: '自定义 CSS',
    labelEn: 'Custom CSS',
    description: '在下方编辑区编写配色（本机保存）',
    category: 'light',
    preview: { bg: '#f8fafc', surface: '#ffffff', accent: '#2563eb', accent2: '#64748b' },
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

// 内置主题CSS定义
const BUILTIN_THEME_CSS: Record<string, string> = {
  'minimal-white': `
    --color-bg: #ffffff; --color-bg-soft: #f8fafc; --color-surface: #ffffff;
    --color-surface-2: #f1f5f9; --color-border: #e2e8f0; --color-text: #0f172a;
    --color-text-2: #475569; --color-text-3: #94a3b8; --color-primary: #2563eb;
    --color-primary-fg: #ffffff; --color-primary-soft: rgba(37,99,235,0.1);
    --color-topbar: #ffffff; --color-topbar-fg: #0f172a; --color-nav-accent: #2563eb;
    --color-success: #059669; --color-warn: #d97706; --color-danger: #dc2626;
    --shadow-card: 0 1px 3px rgba(0,0,0,0.08); --radius: 8px;
  `,
  'dracula': `
    --color-bg: #282a36; --color-bg-soft: #21222c; --color-surface: #44475a;
    --color-surface-2: #383a4a; --color-border: #6272a4; --color-text: #f8f8f2;
    --color-text-2: #e6e6e6; --color-text-3: #6272a4; --color-primary: #ff79c6;
    --color-primary-fg: #282a36; --color-primary-soft: rgba(255,121,198,0.2);
    --color-topbar: #21222c; --color-topbar-fg: #f8f8f2; --color-nav-accent: #ff79c6;
    --color-success: #50fa7b; --color-warn: #f1fa8c; --color-danger: #ff5555;
    --shadow-card: 0 4px 16px rgba(0,0,0,0.3); --radius: 8px;
  `,
  'tokyo-night': `
    --color-bg: #1a1b26; --color-bg-soft: #16171f; --color-surface: #24283b;
    --color-surface-2: #1f2335; --color-border: #3b4261; --color-text: #c0caf5;
    --color-text-2: #9aa5ce; --color-text-3: #565f89; --color-primary: #7aa2f7;
    --color-primary-fg: #1a1b26; --color-primary-soft: rgba(122,162,247,0.2);
    --color-topbar: #16171f; --color-topbar-fg: #c0caf5; --color-nav-accent: #7aa2f7;
    --color-success: #9ece6a; --color-warn: #e0af68; --color-danger: #f7768e;
    --shadow-card: 0 4px 16px rgba(0,0,0,0.4); --radius: 8px;
  `,
  'nord': `
    --color-bg: #2e3440; --color-bg-soft: #282c34; --color-surface: #3b4252;
    --color-surface-2: #434c5e; --color-border: #4c566a; --color-text: #eceff4;
    --color-text-2: #d8dee9; --color-text-3: #8892a4; --color-primary: #88c0d0;
    --color-primary-fg: #2e3440; --color-primary-soft: rgba(136,192,208,0.2);
    --color-topbar: #282c34; --color-topbar-fg: #eceff4; --color-nav-accent: #88c0d0;
    --color-success: #a3be8c; --color-warn: #ebcb8b; --color-danger: #bf616a;
    --shadow-card: 0 4px 16px rgba(0,0,0,0.35); --radius: 6px;
  `,
  'cyberpunk-neon': `
    --color-bg: #0d0221; --color-bg-soft: #0a0118; --color-surface: #1a0a3e;
    --color-surface-2: #150530; --color-border: #ff00ff; --color-text: #ffffff;
    --color-text-2: #e0e0ff; --color-text-3: #9090b0; --color-primary: #ff00ff;
    --color-primary-fg: #0d0221; --color-primary-soft: rgba(255,0,255,0.25);
    --color-topbar: #0a0118; --color-topbar-fg: #00ffff; --color-nav-accent: #ff00ff;
    --color-success: #00ff9f; --color-warn: #ffff00; --color-danger: #ff0040;
    --shadow-card: 0 0 20px rgba(255,0,255,0.3); --radius: 4px;
  `,
  'vaporwave': `
    --color-bg: #1a0a2e; --color-bg-soft: #150828; --color-surface: #2d1b4e;
    --color-surface-2: #241542; --color-border: #ff71ce; --color-text: #e0e0ff;
    --color-text-2: #b8b8d8; --color-text-3: #8080a0; --color-primary: #ff71ce;
    --color-primary-fg: #1a0a2e; --color-primary-soft: rgba(255,113,206,0.25);
    --color-topbar: #150828; --color-topbar-fg: #ff71ce; --color-nav-accent: #ff71ce;
    --color-success: #01cdfe; --color-warn: #b967ff; --color-danger: #ff0040;
    --shadow-card: 0 4px 20px rgba(255,113,206,0.3); --radius: 12px;
  `,
  'jade': `
    --color-bg: #0f1f1a; --color-bg-soft: #0a1810; --color-surface: #1a3d2e;
    --color-surface-2: #152d22; --color-border: #2d5a45; --color-text: #e6f5ec;
    --color-text-2: #b8d4c2; --color-text-3: #6a9a7a; --color-primary: #10b981;
    --color-primary-fg: #0f1f1a; --color-primary-soft: rgba(16,185,129,0.2);
    --color-topbar: #0a1810; --color-topbar-fg: #e6f5ec; --color-nav-accent: #10b981;
    --color-success: #6ee7b7; --color-warn: #fbbf24; --color-danger: #f87171;
    --shadow-card: 0 4px 16px rgba(0,0,0,0.4); --radius: 8px;
  `,
  'sunset': `
    --color-bg: #1a1a1a; --color-bg-soft: #141414; --color-surface: #2d2d2d;
    --color-surface-2: #252525; --color-border: #404040; --color-text: #f5f5f5;
    --color-text-2: #d4d4d4; --color-text-3: #808080; --color-primary: #f97316;
    --color-primary-fg: #1a1a1a; --color-primary-soft: rgba(249,115,22,0.2);
    --color-topbar: #141414; --color-topbar-fg: #f97316; --color-nav-accent: #f97316;
    --color-success: #22c55e; --color-warn: #fbbf24; --color-danger: #ef4444;
    --shadow-card: 0 4px 16px rgba(0,0,0,0.5); --radius: 8px;
  `,
  'y2k-chrome': `
    --color-bg: #dfe4ec; --color-bg-soft: #eef1f6; --color-surface: rgba(255,255,255,0.72);
    --color-surface-2: rgba(255,255,255,0.5); --color-border: rgba(120,135,170,0.32);
    --color-text: #1a1f2e; --color-text-2: #4a536a; --color-text-3: #8590a6;
    --color-primary: #8a5cff; --color-primary-fg: #ffffff;
    --color-primary-soft: rgba(138,92,255,0.15); --color-topbar: rgba(255,255,255,0.9);
    --color-topbar-fg: #1a1f2e; --color-nav-accent: #8a5cff; --color-success: #3ccfd8;
    --color-warn: #ff84c4; --color-danger: #ff5c5c; --shadow-card: 0 12px 30px rgba(70,90,130,0.22);
    --radius: 26px;
  `,
  'xiaohongshu-white': `
    --color-bg: #fffdfb; --color-bg-soft: #fff6f1; --color-surface: #ffffff;
    --color-surface-2: #fff1ea; --color-border: rgba(60,30,20,0.1);
    --color-text: #1a1210; --color-text-2: #4f3a32; --color-text-3: #a08d85;
    --color-primary: #ff2742; --color-primary-fg: #ffffff;
    --color-primary-soft: rgba(255,39,66,0.1); --color-topbar: #ffffff;
    --color-topbar-fg: #1a1210; --color-nav-accent: #ff2742; --color-success: #3ba55c;
    --color-warn: #f5a524; --color-danger: #ff2742; --shadow-card: 0 12px 30px rgba(255,39,66,0.08);
    --radius: 20px;
  `,
  'japanese-minimal': `
    --color-bg: #faf9f6; --color-bg-soft: #f5f3ef; --color-surface: #ffffff;
    --color-surface-2: #faf9f6; --color-border: #d4cfc7; --color-text: #2c2c2c;
    --color-text-2: #5c5c5c; --color-text-3: #8a8a8a; --color-primary: #c41e3a;
    --color-primary-fg: #ffffff; --color-primary-soft: rgba(196,30,58,0.1);
    --color-topbar: #ffffff; --color-topbar-fg: #2c2c2c; --color-nav-accent: #c41e3a;
    --color-success: #4a7c59; --color-warn: #b8860b; --color-danger: #c41e3a;
    --shadow-card: 0 1px 4px rgba(0,0,0,0.04); --radius: 2px;
  `,
};

function injectThemeVars(theme: ThemeId) {
  const vars = BUILTIN_THEME_CSS[theme];
  if (vars) {
    const root = document.documentElement;
    root.style.cssText = vars;
  }
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
    injectThemeVars(theme);
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
  } else {
    injectThemeVars(theme);
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
