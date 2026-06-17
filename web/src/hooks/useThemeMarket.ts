/**
 * useThemeMarket - 主题市场核心 hook
 * 整合内置主题 + 用户主题 + 当前主题
 */
import { useState, useCallback, useEffect } from 'react';
import { THEME_PRESETS } from '../lib/theme-v2';
import { loadUserThemes, saveUserThemes, setActiveThemeId, getActiveThemeId, importTheme as importThemeFn } from '../lib/theme-storage';
import type { ThemePackage } from '../types/theme-package';

export function useThemeMarket() {
  const builtInPresets: ThemePackage[] = THEME_PRESETS.map(p => ({
    id: p.id,
    name: p.name,
    author: '官方',
    version: '1.0.0',
    basePreset: p.id,
    description: p.description,
    colors: p.colors,
    visualStyle: p.visualStyle,
    density: p.density,
    radius: p.radius,
    spacing: p.spacing,
    shadow: p.shadow,
    motion: p.motion,
    createdAt: 0,
  }));

  const [userPresets, setUserPresets] = useState<ThemePackage[]>([]);
  const [activeId, setActiveId] = useState<string>(builtInPresets[0]?.id || '');

  useEffect(() => {
    setUserPresets(loadUserThemes());
    const stored = getActiveThemeId();
    if (stored) setActiveId(stored);
  }, []);

  const allPresets = [...builtInPresets, ...userPresets];
  const activeTheme = allPresets.find(t => t.id === activeId) || builtInPresets[0];

  const setActive = useCallback((id: string) => {
    setActiveId(id);
    setActiveThemeId(id);
    document.documentElement.setAttribute('data-theme', id);
  }, []);

  const addUserTheme = useCallback((theme: ThemePackage) => {
    setUserPresets(prev => {
      const next = [...prev.filter(t => t.id !== theme.id), theme];
      saveUserThemes(next);
      return next;
    });
  }, []);

  const removeUserTheme = useCallback((id: string) => {
    setUserPresets(prev => {
      const next = prev.filter(t => t.id !== id);
      saveUserThemes(next);
      return next;
    });
  }, []);

  const cloneFromPreset = useCallback((presetId: string, name: string) => {
    const src = builtInPresets.find(p => p.id === presetId);
    if (!src) return null;
    return {
      ...src,
      id: 'user-' + Date.now().toString(36),
      name,
      author: '我',
      version: '1.0.0',
      basePreset: presetId,
      createdAt: Date.now(),
    };
  }, [builtInPresets]);

  return {
    builtInPresets,
    userPresets,
    allPresets,
    activeTheme,
    activeId,
    setActive,
    setActiveTheme: setActive, // SPEC 命名兼容
    addUserTheme,
    removeUserTheme,
    deleteUserTheme: removeUserTheme, // SPEC 命名兼容
    exportCurrent: () => {
      const theme = allPresets.find(t => t.id === activeId);
      if (!theme) return '';
      return JSON.stringify(theme, null, 2);
    },
    import: async (file: File) => {
      const text = await file.text();
      const theme = importThemeFn(text);
      addUserTheme(theme);
    },
    cloneFromPreset,
  };
}
