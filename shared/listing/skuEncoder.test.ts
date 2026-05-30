import { describe, expect, it } from 'vitest';
import { encodeSku, encodeDummyHookSku, parseSku } from './skuEncoder.js';

describe('skuEncoder BRD v1.1', () => {
  it('encodes five-part example BF-0001-PR-WH-S', () => {
    const code = encodeSku({
      prefix: 'BF',
      sequence: 1,
      side: 'PR',
      color: '白色',
      size: 'S',
    });
    expect(code).toBe('BF-0001-PR-WH-S');
  });

  it('encodes dummy hook white hook sku', () => {
    expect(encodeDummyHookSku('BF', 'M')).toBe('BF-9999-P-WH-M');
  });

  it('round-trips parse', () => {
    const parsed = parseSku('BF-0001-PR-WH-S');
    expect(parsed).toEqual({
      prefix: 'BF',
      sequence: 1,
      side: 'PR',
      colorCode: 'WH',
      size: 'S',
      isDummyHook: false,
    });
  });

  it('detects dummy hook from parse', () => {
    const parsed = parseSku('BF-9999-P-WH-L');
    expect(parsed?.isDummyHook).toBe(true);
  });

  it('throws on unknown color', () => {
    expect(() =>
      encodeSku({ sequence: 1, side: 'P', color: '金色', size: 'M' }),
    ).toThrow(/UNKNOWN_COLOR/);
  });
});
