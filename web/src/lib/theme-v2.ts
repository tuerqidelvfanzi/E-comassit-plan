/**
 * 电商助手多维度主题系统 v2.0
 */

import { useSyncExternalStore } from 'react';

// ============ 类型定义 ============

export type VisualStyle = 'trello' | 'linear' | 'monday' | 'enterprise';
export type Density = 'compact' | 'comfortable' | 'spacious';
export type Radius = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type Spacing = 'tight' | 'normal' | 'loose';
export type ShadowLevel = 'none' | 'soft' | 'medium' | 'heavy' | 'glow';
export type MotionLevel = 'none' | 'subtle' | 'moderate' | 'playful';

export type ColorScheme = {
  primary: string;
  primaryFg: string;
  bg: string;
  bgGradientFrom: string;
  bgGradientTo: string;
  surface: string;
  muted: string;
  text: string;
  textMuted: string;
  textLabel: string;
  border: string;
  success: string;
  successSoft: string;
  successFg: string;
  warn: string;
  warnSoft: string;
  warnFg: string;
  danger: string;
  badgeBg: string;
  badgeFg: string;
  focusRing: string;
  topbar: string;
  topbarFg: string;
  sidebarFg: string;
  navAccent: string;
};

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  visualStyle: VisualStyle;
  density: Density;
  radius: Radius;
  spacing: Spacing;
  shadow: ShadowLevel;
  motion: MotionLevel;
  colors: ColorScheme;
};

// ============ 预设主题包 ============

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'trello-premium',
    name: 'Trello 高级风',
    description: '扁平卡片、清爽布局，适合流程管理',
    visualStyle: 'trello',
    density: 'comfortable',
    radius: 'lg',
    spacing: 'normal',
    shadow: 'soft',
    motion: 'moderate',
    colors: {
      primary: '#0079BF',
      primaryFg: '#FFFFFF',
      bg: '#F7F7F7',
      bgGradientFrom: '#F7F7F7',
      bgGradientTo: '#FFFFFF',
      surface: '#FFFFFF',
      muted: '#F5F5F5',
      text: '#172B4D',
      textMuted: '#5E6C7B',
      textLabel: '#244461',
      border: '#DFE1E6',
      success: '#61BD4F',
      successSoft: '#E3FCE4',
      successFg: '#1B5E20',
      warn: '#FFAB00',
      warnSoft: '#FFF3CD',
      warnFg: '#8B5E00',
      danger: '#EB5A46',
      badgeBg: '#F5F5F5',
      badgeFg: '#5E6C7B',
      focusRing: 'rgba(0, 121, 191, 0.3)',
      topbar: '#0079BF',
      topbarFg: '#FFFFFF',
      sidebarFg: '#5E6C7B',
      navAccent: '#0079BF',
    },
  },
  {
    id: 'linear-dark',
    name: 'Linear 极客风',
    description: '极简克制、深色优先，适合专业用户',
    visualStyle: 'linear',
    density: 'compact',
    radius: 'none',
    spacing: 'tight',
    shadow: 'heavy',
    motion: 'subtle',
    colors: {
      primary: '#5E6AD2',
      primaryFg: '#FFFFFF',
      bg: '#0D0D0D',
      bgGradientFrom: '#0D0D0D',
      bgGradientTo: '#1A1A1A',
      surface: '#1A1A1A',
      muted: '#262626',
      text: '#E5E5E5',
      textMuted: '#808080',
      textLabel: '#B3B3B3',
      border: '#2D2D2D',
      success: '#4ADE80',
      successSoft: 'rgba(74, 222, 128, 0.15)',
      successFg: '#4ADE80',
      warn: '#FBBF24',
      warnSoft: 'rgba(251, 191, 36, 0.15)',
      warnFg: '#FBBF24',
      danger: '#F87171',
      badgeBg: '#262626',
      badgeFg: '#E5E5E5',
      focusRing: 'rgba(94, 106, 210, 0.4)',
      topbar: '#1A1A1A',
      topbarFg: '#E5E5E5',
      sidebarFg: '#808080',
      navAccent: '#5E6AD2',
    },
  },
  {
    id: 'monday-vibrant',
    name: 'Monday 活力风',
    description: '多彩标签、渐变点缀，适合创意团队',
    visualStyle: 'monday',
    density: 'comfortable',
    radius: 'xl',
    spacing: 'loose',
    shadow: 'medium',
    motion: 'playful',
    colors: {
      primary: '#FF3D57',
      primaryFg: '#FFFFFF',
      bg: '#FAFAFA',
      bgGradientFrom: '#FAFAFA',
      bgGradientTo: '#F5F5F5',
      surface: '#FFFFFF',
      muted: '#F0F0F0',
      text: '#1A1A1A',
      textMuted: '#676767',
      textLabel: '#333333',
      border: '#E6E6E6',
      success: '#00C875',
      successSoft: '#E6F9EE',
      successFg: '#00A344',
      warn: '#FFCB00',
      warnSoft: '#FFF8E1',
      warnFg: '#8B6914',
      danger: '#FF3D57',
      badgeBg: '#F0F0F0',
      badgeFg: '#676767',
      focusRing: 'rgba(255, 61, 87, 0.3)',
      topbar: '#FF3D57',
      topbarFg: '#FFFFFF',
      sidebarFg: '#676767',
      navAccent: '#FF3D57',
    },
  },
  {
    id: 'enterprise-classic',
    name: '企业商务风',
    description: '保守专业、蓝色主调，适合企业环境',
    visualStyle: 'enterprise',
    density: 'compact',
    radius: 'sm',
    spacing: 'tight',
    shadow: 'none',
    motion: 'none',
    colors: {
      primary: '#1E40AF',
      primaryFg: '#FFFFFF',
      bg: '#F1F5F9',
      bgGradientFrom: '#F1F5F9',
      bgGradientTo: '#E2E8F0',
      surface: '#FFFFFF',
      muted: '#E2E8F0',
      text: '#1E293B',
      textMuted: '#64748B',
      textLabel: '#334155',
      border: '#CBD5E1',
      success: '#047857',
      successSoft: '#D1FAE5',
      successFg: '#065F46',
      warn: '#B45309',
      warnSoft: '#FEF3C7',
      warnFg: '#92400E',
      danger: '#B91C1C',
      badgeBg: '#E2E8F0',
      badgeFg: '#334155',
      focusRing: 'rgba(30, 64, 175, 0.25)',
      topbar: '#1E40AF',
      topbarFg: '#FFFFFF',
      sidebarFg: '#64748B',
      navAccent: '#1E40AF',
    },
  },
];

// ============ 维度映射 ============

const RADIUS_MAP: Record<Radius, string> = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '24px',
};

const SPACING_MAP: Record<Spacing, { xs: string; sm: string; md: string; lg: string }> = {
  tight: { xs: '2px', sm: '4px', md: '8px', lg: '12px' },
  normal: { xs: '4px', sm: '8px', md: '16px', lg: '24px' },
  loose: { xs: '8px', sm: '12px', md: '24px', lg: '32px' },
};

const SHADOW_MAP: Record<ShadowLevel, string> = {
  none: 'none',
  soft: '0 1px 3px rgba(0,0,0,0.08)',
  medium: '0 4px 12px rgba(0,0,0,0.12)',
  heavy: '0 8px 24px rgba(0,0,0,0.2)',
  glow: '0 0 20px rgba(0,240,255,0.3)',
};

const MOTION_MAP: Record<MotionLevel, { fast: string; normal: string; playful: string }> = {
  none: { fast: '0ms', normal: '0ms', playful: '0ms' },
  subtle: { fast: '100ms', normal: '200ms', playful: '300ms' },
  moderate: { fast: '150ms', normal: '250ms', playful: '400ms' },
  playful: { fast: '200ms', normal: '350ms', playful: '500ms' },
};

const DENSITY_MAP: Record<Density, { rowHeight: string; padding: string }> = {
  compact: { rowHeight: '32px', padding: '8px 12px' },
  comfortable: { rowHeight: '44px', padding: '12px 16px' },
  spacious: { rowHeight: '56px', padding: '16px 20px' },
};

// ============ CSS 生成 ============

export function generateThemeCSS(preset: ThemePreset, colorOverrides?: Partial<ColorScheme>): string {
  const colors = { ...preset.colors, ...colorOverrides };
  const spacing = SPACING_MAP[preset.spacing];
  const shadow = SHADOW_MAP[preset.shadow];
  const motion = MOTION_MAP[preset.motion];
  const density = DENSITY_MAP[preset.density];
  const radiusCard = RADIUS_MAP[preset.radius];

  return [
    '/* Theme: ' + preset.name + ' */',
    ':root[data-preset="' + preset.id + '"] {',
    '  --color-primary: ' + colors.primary + ';',
    '  --color-primary-fg: ' + colors.primaryFg + ';',
    '  --color-bg: ' + colors.bg + ';',
    '  --color-bg-gradient-from: ' + colors.bgGradientFrom + ';',
    '  --color-bg-gradient-to: ' + colors.bgGradientTo + ';',
    '  --color-surface: ' + colors.surface + ';',
    '  --color-muted: ' + colors.muted + ';',
    '  --color-text: ' + colors.text + ';',
    '  --color-text-muted: ' + colors.textMuted + ';',
    '  --color-text-label: ' + colors.textLabel + ';',
    '  --color-border: ' + colors.border + ';',
    '  --color-success: ' + colors.success + ';',
    '  --color-success-soft: ' + colors.successSoft + ';',
    '  --color-success-fg: ' + colors.successFg + ';',
    '  --color-warn: ' + colors.warn + ';',
    '  --color-warn-soft: ' + colors.warnSoft + ';',
    '  --color-warn-fg: ' + colors.warnFg + ';',
    '  --color-danger: ' + colors.danger + ';',
    '  --color-badge-default-bg: ' + colors.badgeBg + ';',
    '  --color-badge-default-fg: ' + colors.badgeFg + ';',
    '  --color-focus-ring: ' + colors.focusRing + ';',
    '  --color-topbar: ' + colors.topbar + ';',
    '  --color-topbar-fg: ' + colors.topbarFg + ';',
    '  --color-sidebar-fg: ' + colors.sidebarFg + ';',
    '  --color-nav-accent: ' + colors.navAccent + ';',
    '  --color-primary-soft: color-mix(in srgb, ' + colors.primary + ' 15%, transparent);',
    '',
    '  --radius-none: ' + RADIUS_MAP.none + ';',
    '  --radius-sm: ' + RADIUS_MAP.sm + ';',
    '  --radius-md: ' + RADIUS_MAP.md + ';',
    '  --radius-lg: ' + RADIUS_MAP.lg + ';',
    '  --radius-xl: ' + RADIUS_MAP.xl + ';',
    '  --radius-card: ' + radiusCard + ';',
    '',
    '  --space-xs: ' + spacing.xs + ';',
    '  --space-sm: ' + spacing.sm + ';',
    '  --space-md: ' + spacing.md + ';',
    '  --space-lg: ' + spacing.lg + ';',
    '',
    '  --shadow-card: ' + shadow + ';',
    '',
    '  --transition-fast: ' + motion.fast + ' ease;',
    '  --transition-normal: ' + motion.normal + ' ease;',
    '  --transition-playful: ' + motion.playful + ' cubic-bezier(0.34, 1.56, 0.64, 1);',
    '',
    '  --density-row-height: ' + density.rowHeight + ';',
    '  --density-padding: ' + density.padding + ';',
    '}',
  ].join('\n');
}

// ============ 存储键 ============

const PRESET_KEY = 'psa_theme_preset';
const COLORS_KEY = 'psa_theme_colors';
const STYLE_ID = 'psa-theme-v2-style';

export function getStoredPresetId(): string {
  const stored = localStorage.getItem(PRESET_KEY);
  const validIds = THEME_PRESETS.map(p => p.id);
  return validIds.includes(stored ?? '') ? stored! : 'trello-premium';
}

export function getStoredColorOverrides(): Partial<ColorScheme> | null {
  const stored = localStorage.getItem(COLORS_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// ============ 应用主题 ============

export function applyPreset(presetId: string, colorOverrides?: Partial<ColorScheme>) {
  const preset = THEME_PRESETS.find(p => p.id === presetId);
  if (!preset) return;

  localStorage.setItem(PRESET_KEY, presetId);
  
  if (colorOverrides) {
    localStorage.setItem(COLORS_KEY, JSON.stringify(colorOverrides));
  } else {
    localStorage.removeItem(COLORS_KEY);
  }

  document.getElementById(STYLE_ID)?.remove();

  const mergedOverrides = colorOverrides ?? getStoredColorOverrides() ?? {};
  const css = generateThemeCSS(preset, Object.keys(mergedOverrides).length > 0 ? mergedOverrides : undefined);
  
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);

  document.documentElement.setAttribute('data-preset', presetId);
  document.documentElement.setAttribute('data-visual', preset.visualStyle);
  document.documentElement.setAttribute('data-density', preset.density);
  document.documentElement.setAttribute('data-radius', preset.radius);

  window.dispatchEvent(new Event('theme-change'));
}

export function updateColorOverrides(overrides: Partial<ColorScheme>) {
  const currentOverrides = getStoredColorOverrides() ?? {};
  const merged = { ...currentOverrides, ...overrides };
  applyPreset(getStoredPresetId(), merged);
}

export function resetColorOverrides() {
  applyPreset(getStoredPresetId(), undefined);
}

export function initThemeV2() {
  const presetId = getStoredPresetId();
  const colorOverrides = getStoredColorOverrides();
  applyPreset(presetId, colorOverrides ?? undefined);
}

// ============ React Hook ============

function subscribe(cb: () => void) {
  window.addEventListener('theme-change', cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener('theme-change', cb);
    window.removeEventListener('storage', cb);
  };
}

export function useThemeV2() {
  const presetId = useSyncExternalStore(subscribe, getStoredPresetId, () => 'trello-premium');
  const colorOverrides = useSyncExternalStore(subscribe, getStoredColorOverrides, () => null);
  const preset = THEME_PRESETS.find(p => p.id === presetId) ?? THEME_PRESETS[0];

  return {
    preset,
    presets: THEME_PRESETS,
    colorOverrides,
    setPreset: (id: string) => applyPreset(id),
    updateColors: updateColorOverrides,
    resetColors: resetColorOverrides,
  };
}
