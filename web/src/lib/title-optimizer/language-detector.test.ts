import { describe, it, expect } from 'vitest';
import { detectLanguage, getLanguageName } from './language-detector';

describe('detectLanguage', () => {
  it('检测中文', () => {
    expect(detectLanguage('无线蓝牙耳机')).toBe('zh');
  });

  it('检测日文', () => {
    expect(detectLanguage('ワイヤレスイヤホン')).toBe('ja');
  });

  it('检测韩文', () => {
    expect(detectLanguage('무선 이어폰')).toBe('ko');
  });

  it('检测英文', () => {
    expect(detectLanguage('Wireless Earbuds')).toBe('en');
  });

  it('检测西班牙语', () => {
    expect(detectLanguage('Auriculares inalámbricos')).toBe('es');
  });

  it('空字符串默认英文', () => {
    expect(detectLanguage('')).toBe('en');
  });
});

describe('getLanguageName', () => {
  it('返回本地化名称', () => {
    expect(getLanguageName('zh')).toBe('中文');
    expect(getLanguageName('en')).toBe('English');
  });
});
