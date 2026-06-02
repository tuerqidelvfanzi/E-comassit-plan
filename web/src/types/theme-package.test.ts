/**
 * ThemePackage 单元测试
 */
import { describe, it, expect } from 'vitest';
import { validateThemePackage } from './theme-package';

describe('ThemePackage', () => {
  it('合法主题包通过校验', () => {
    const valid = {
      id: 'test-1',
      name: 'Test Theme',
      author: 'tester',
      version: '1.0.0',
      colors: { primary: '#000' },
    };
    expect(validateThemePackage(valid)).toBe(true);
  });

  it('缺失必填字段失败', () => {
    const invalid = { id: 'x', name: 'X' };
    expect(validateThemePackage(invalid)).toBe(false);
  });

  it('非对象失败', () => {
    expect(validateThemePackage(null)).toBe(false);
    expect(validateThemePackage('string')).toBe(false);
    expect(validateThemePackage(42)).toBe(false);
  });

  it('空 id/name 失败', () => {
    expect(validateThemePackage({
      id: '', name: 'X', author: 'a', version: '1', colors: {}
    })).toBe(false);
  });
});
