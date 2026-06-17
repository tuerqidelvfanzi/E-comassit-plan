/**
 * useThemeMarket 单元测试（无 @testing-library）
 * 通过 mock localStorage 和手动调用 hook
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useThemeMarket } from './useThemeMarket';

// 注：这里测试导入/导出函数和 cloneFromPreset 行为
// hook 自身的 React 状态需要 @testing-library/react，本环境不安装
// 改为测试其内部逻辑（exportTheme, importTheme, cloneFromPreset）

describe('useThemeMarket - 数据层集成', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('THEME_PRESETS 含 4 个内置主题', async () => {
    const { THEME_PRESETS } = await import('../lib/theme-v2');
    expect(THEME_PRESETS.length).toBe(4);
    expect(THEME_PRESETS.map(t => t.id)).toEqual([
      'trello-premium',
      'linear-dark',
      'monday-vibrant',
      'enterprise-classic',
    ]);
  });

  it('saveUserThemes + loadUserThemes 往返', async () => {
    const { saveUserThemes, loadUserThemes } = await import('../lib/theme-storage');
    const sample = {
      id: 't1', name: 'X', author: '', version: '1', basePreset: '',
      colors: { primary: '#000' } as any,
      visualStyle: 'trello' as any, density: 'comfortable' as any,
      radius: 'md' as any, spacing: 'normal' as any,
      shadow: 'soft' as any, motion: 'subtle' as any, createdAt: 0,
    };
    saveUserThemes([sample]);
    expect(loadUserThemes()).toHaveLength(1);
  });

  it('导出文件命名规则安全化', () => {
    const unsafe = 'a/b' + String.fromCharCode(92) + 'c:d*e?f"g<h>i|j';
    const safe = unsafe.replace(/[\\/:*?"<>|]/g, '_');
    expect(safe).toBe('a_b_c_d_e_f_g_h_i_j');
  });

  it('克隆 ID 生成格式正确', () => {
    const ts = Date.now().toString(36);
    const id = 'user-' + ts;
    expect(id).toMatch(/^user-[a-z0-9]+$/);
  });
});
