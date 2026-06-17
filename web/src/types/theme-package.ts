/**
 * ThemePackage - V3.1 主题包数据模型
 * 用途: 支持主题导入/导出/市场分享
 */
import type { ColorScheme, VisualStyle, Density, Radius, Spacing, ShadowLevel, MotionLevel } from '../lib/theme-v2';

export interface ThemePackage {
  id: string;
  name: string;
  author: string;
  version: string;
  basePreset: string;
  description?: string;
  colors: ColorScheme;
  visualStyle: VisualStyle;
  density: Density;
  radius: Radius;
  spacing: Spacing;
  shadow: ShadowLevel;
  motion: MotionLevel;
  createdAt: number;
  thumbnail?: string;
}

export const THEME_PACKAGE_SCHEMA = {
  required: ['id', 'name', 'author', 'version', 'colors'],
  version: '1.0.0',
} as const;

export function validateThemePackage(data: unknown): data is ThemePackage {
  if (!data || typeof data !== 'object') return false;
  const pkg = data as Partial<ThemePackage>;
  for (const key of THEME_PACKAGE_SCHEMA.required) {
    if (!(key in pkg)) return false;
  }
  if (typeof pkg.id !== 'string' || pkg.id.length === 0) return false;
  if (typeof pkg.name !== 'string' || pkg.name.length === 0) return false;
  if (typeof pkg.author !== 'string') return false;
  if (typeof pkg.version !== 'string') return false;
  if (!pkg.colors || typeof pkg.colors !== 'object') return false;
  return true;
}
