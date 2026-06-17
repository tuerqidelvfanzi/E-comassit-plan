import { describe, expect, it } from 'vitest';
import { validateTitle, truncateTitle, VIETNAM_TITLE_MAX } from './titleRules.js';

describe('titleRules', () => {
  it('passes title within 20 chars', () => {
    const result = validateTitle('Ao thun xanh duong');
    expect(result.ok).toBe(true);
    expect(result.charCount).toBe(18);
  });

  it('fails title over 20 chars', () => {
    const result = validateTitle('A'.repeat(21));
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.code).toBe('TITLE_TOO_LONG');
  });

  it('warns when too many CJK chars', () => {
    const result = validateTitle('可爱蓝色小熊简装款加厚保暖');
    expect(result.issues.some((i) => i.code === 'CJK_TOO_MANY')).toBe(true);
  });

  it('truncates to max chars', () => {
    expect(truncateTitle('123456789012345678901', VIETNAM_TITLE_MAX).length).toBe(20);
  });
});
