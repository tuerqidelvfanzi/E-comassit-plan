import { describe, expect, it } from 'vitest';
import { isNormalizedProduct } from './collectTypes';

describe('isNormalizedProduct', () => {
  it('accepts minimal valid payload', () => {
    expect(
      isNormalizedProduct({
        title: '测试',
        sourceUrl: 'https://example.com/p',
      }),
    ).toBe(true);
  });

  it('rejects empty', () => {
    expect(isNormalizedProduct(null)).toBe(false);
  });
});
