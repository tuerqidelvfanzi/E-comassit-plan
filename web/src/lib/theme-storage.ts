/**
 * 主题存储 - 负责用户主题持久化、导入、导出
 * 设计: 防错式 - 严格校验、失败时清除损坏数据
 */
import { validateThemePackage, type ThemePackage } from '../types/theme-package';

const STORAGE_KEY = 'ecom-theme-user-presets';
const ACTIVE_KEY = 'ecom-theme-active-id';

interface Storage {
  presets: ThemePackage[];
}

export function exportTheme(theme: ThemePackage): string {
  return JSON.stringify(theme, null, 2);
}

export function importTheme(json: string): ThemePackage {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (e) {
    throw new Error('JSON 解析失败: ' + (e as Error).message);
  }
  if (!validateThemePackage(data)) {
    throw new Error('主题包格式不合法（必填字段缺失）');
  }
  return data as ThemePackage;
}

export function saveUserThemes(themes: ThemePackage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ presets: themes }));
  } catch (e) {
    console.error('保存用户主题失败', e);
  }
}

export function loadUserThemes(): ThemePackage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data: Storage = JSON.parse(raw);
    return Array.isArray(data.presets) ? data.presets.filter(validateThemePackage) : [];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export function setActiveThemeId(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function getActiveThemeId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}
