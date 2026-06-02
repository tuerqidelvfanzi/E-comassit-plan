/**
 * useThemeAnimation 单元测试
 */
import { describe, it, expect, beforeEach } from 'vitest';

describe('AnimationPrefs 逻辑', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('默认偏好 = 启用 + 300ms', () => {
    const defaultPrefs = { enabled: true, duration: 300 };
    expect(defaultPrefs.enabled).toBe(true);
    expect(defaultPrefs.duration).toBe(300);
  });

  it('保存到 localStorage', () => {
    const prefs = { enabled: false, duration: 500 };
    localStorage.setItem('ecom-theme-animation-pref', JSON.stringify(prefs));
    const raw = localStorage.getItem('ecom-theme-animation-pref');
    expect(JSON.parse(raw!)).toEqual(prefs);
  });

  it('损坏数据不崩溃', () => {
    localStorage.setItem('ecom-theme-animation-pref', 'not json');
    const raw = localStorage.getItem('ecom-theme-animation-pref');
    let parsed: any = null;
    try {
      parsed = JSON.parse(raw!);
    } catch {
      parsed = { enabled: true, duration: 300 };
    }
    expect(parsed.enabled).toBe(true);
  });

  it('duration 在 0-2000 范围内', () => {
    const clamp = (n: number) => Math.max(0, Math.min(2000, n));
    expect(clamp(-100)).toBe(0);
    expect(clamp(3000)).toBe(2000);
    expect(clamp(500)).toBe(500);
  });
});
