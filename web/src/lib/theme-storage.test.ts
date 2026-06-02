/**
 * theme-storage 单元测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { exportTheme, importTheme, saveUserThemes, loadUserThemes } from './theme-storage';

const sample = {
  id: 'test',
  name: 'Test',
  author: 'me',
  version: '1.0.0',
  basePreset: 'trello-premium',
  colors: { primary: '#fff' } as any,
  visualStyle: 'trello' as any,
  density: 'comfortable' as any,
  radius: 'md' as any,
  spacing: 'normal' as any,
  shadow: 'soft' as any,
  motion: 'subtle' as any,
  createdAt: 0,
};

describe('theme-storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('exportTheme 生成 JSON', () => {
    const json = exportTheme(sample);
    expect(json).toContain('"id": "test"');
  });

  it('importTheme 解析合法 JSON', () => {
    const json = JSON.stringify(sample);
    const result = importTheme(json);
    expect(result.id).toBe('test');
  });

  it('importTheme 拒绝非法 JSON', () => {
    expect(() => importTheme('not json')).toThrow();
  });

  it('importTheme 拒绝格式错误', () => {
    expect(() => importTheme('{}')).toThrow();
  });

  it('saveUserThemes + loadUserThemes 往返', () => {
    saveUserThemes([sample]);
    const loaded = loadUserThemes();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('test');
  });

  it('损坏数据自动清除', () => {
    localStorage.setItem('ecom-theme-user-presets', 'not json');
    expect(loadUserThemes()).toEqual([]);
  });
});
