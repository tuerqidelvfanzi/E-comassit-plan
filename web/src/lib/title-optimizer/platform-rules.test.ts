/**
 * 平台规则测试
 */
import { describe, it, expect } from 'vitest';
import { PLATFORM_RULES, getRule } from './platform-rules';

describe('PLATFORM_RULES', () => {
  it('5 个平台规则齐备', () => {
    expect(Object.keys(PLATFORM_RULES)).toHaveLength(5);
  });

  it('amazon 长度 200', () => {
    expect(PLATFORM_RULES.amazon.maxLength).toBe(200);
  });

  it('ebay 长度 80', () => {
    expect(PLATFORM_RULES.ebay.maxLength).toBe(80);
  });

  it('shopee 允许 emoji', () => {
    expect(PLATFORM_RULES.shopee.allowEmoji).toBe(true);
  });

  it('getRule 返回正确规则', () => {
    expect(getRule('tiktok').maxLength).toBe(150);
  });
});
