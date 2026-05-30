import { describe, expect, it } from 'vitest';
import { scanSensitiveContent, validateImageSet } from './imageRules.js';

describe('imageRules', () => {
  it('detects sensitive keywords', () => {
    const hits = scanSensitiveContent('厂家介绍 终身质保 LOGO');
    expect(hits).toContain('厂家介绍');
    expect(hits).toContain('终身质保');
  });

  it('requires 9 images for Shopee VN', () => {
    const result = validateImageSet(8, 'shopee-vn');
    expect(result.ok).toBe(false);
  });

  it('requires 5 main images for TikTok TH', () => {
    expect(validateImageSet(5, 'tiktok-th').ok).toBe(true);
    expect(validateImageSet(4, 'tiktok-th').ok).toBe(false);
  });
});
