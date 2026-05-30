import { describe, expect, it } from 'vitest';
import { encodeSku, parseSku, variantSuffixForPrint } from './skuEncoder.js';

describe('skuEncoder', () => {
  it('encodes BRD example white M black print', () => {
    const code = encodeSku({
      color: '白色',
      size: 'M',
      sequence: 12,
      variantSuffix: 'B',
    });
    expect(code).toBe('01T-C10-M-G0012-B');
  });

  it('encodes black L white print variant', () => {
    const code = encodeSku({
      color: '黑色',
      size: 'L',
      sequence: 12,
      variantSuffix: variantSuffixForPrint('blackOnWhite'),
    });
    expect(code).toBe('01T-C20-L-G0012-H');
  });

  it('round-trips parse', () => {
    const raw = '01T-C10-M-G0012-B';
    const parsed = parseSku(raw);
    expect(parsed).toEqual({
      prefix: '01T',
      colorCode: 'C10',
      sizeCode: 'M',
      sequence: 12,
      variantSuffix: 'B',
    });
  });

  it('throws on unknown color', () => {
    expect(() => encodeSku({ color: '金色', size: 'M', sequence: 1 })).toThrow(/UNKNOWN_COLOR/);
  });
});
