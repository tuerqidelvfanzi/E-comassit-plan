/**
 * useThemeAnimation - 动画状态与用户偏好
 * 防错式: prefers-reduced-motion 自动检测
 */
import { useState, useEffect } from 'react';

export interface AnimationPrefs {
  enabled: boolean;
  duration: number; // ms
  reducedMotion: boolean;
}

const STORAGE_KEY = 'ecom-theme-animation-pref';

export function useThemeAnimation(): {
  prefs: AnimationPrefs;
  setEnabled: (enabled: boolean) => void;
  setDuration: (duration: number) => void;
} {
  const [prefs, setPrefs] = useState<AnimationPrefs>({
    enabled: true,
    duration: 300,
    reducedMotion: false,
  });

  useEffect(() => {
    // 读取 localStorage
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw);
        setPrefs(p => ({ ...p, ...stored, reducedMotion: detectReducedMotion() }));
      } else {
        setPrefs(p => ({ ...p, reducedMotion: detectReducedMotion() }));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (prefs.reducedMotion) {
      // 系统偏好强制 0ms
      document.documentElement.style.setProperty('--theme-transition-duration', '0ms');
    } else if (prefs.enabled) {
      document.documentElement.style.setProperty(
        '--theme-transition-duration',
        prefs.duration + 'ms'
      );
    } else {
      document.documentElement.style.setProperty('--theme-transition-duration', '0ms');
    }
  }, [prefs.enabled, prefs.duration, prefs.reducedMotion]);

  function setEnabled(enabled: boolean) {
    const next = { ...prefs, enabled };
    setPrefs(next);
    savePrefs(next);
  }

  function setDuration(duration: number) {
    const next = { ...prefs, duration: Math.max(0, Math.min(2000, duration)) };
    setPrefs(next);
    savePrefs(next);
  }

  return { prefs, setEnabled, setDuration };
}

function detectReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function savePrefs(prefs: AnimationPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      enabled: prefs.enabled,
      duration: prefs.duration,
    }));
  } catch {
    // ignore
  }
}
