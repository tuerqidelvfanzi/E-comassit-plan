import { describe, expect, it } from 'vitest';
import { detectMaterial, scanAntiBan, validateMaterialConsistency } from './antiBan.js';

describe('antiBan material scan', () => {
  it('detects cotton and polyester', () => {
    expect(detectMaterial('100%纯棉T恤')).toBe('cotton');
    expect(detectMaterial('Polyester fabric')).toBe('polyester');
  });

  it('flags cotton source with polyester listing', () => {
    const result = scanAntiBan('纯棉面料', '100% Polyester T-shirt');
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === 'MATERIAL_MISMATCH')).toBe(true);
  });

  it('allows white hook polyester listing', () => {
    const result = scanAntiBan('涤纶', 'Polyester White Hook', { allowPolyesterListing: true });
    expect(result.ok).toBe(true);
  });

  it('validates from attributes object', () => {
    const result = validateMaterialConsistency({ 材质: '纯棉' }, '优质 Polyester 面料');
    expect(result.ok).toBe(false);
  });

  it('flags BRD banned brands', () => {
    const result = scanAntiBan('', 'Gucci 正品 T恤');
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === 'BANNED_TERM')).toBe(true);
  });

  it('flags domestic identifiers', () => {
    const result = scanAntiBan('', '3C认证 产地：广东');
    expect(result.issues.some((i) => i.message.includes('国内标识'))).toBe(true);
  });
});
