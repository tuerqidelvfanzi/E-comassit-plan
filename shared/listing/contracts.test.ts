import { describe, expect, it } from 'vitest';
import { evaluateAdsPowerGate, estimateTokenCost } from './contracts.js';
import { applyProductFilters } from './productFilters.js';

describe('contracts', () => {
  it('evaluates ADS Power gate when unreachable', () => {
    const result = evaluateAdsPowerGate(false);
    expect(result.available).toBe(false);
    expect(result.reason).toBe('ADS_POWER_UNREACHABLE');
  });

  it('evaluates ADS Power gate with active profile', () => {
    const result = evaluateAdsPowerGate(true, [
      { profileId: 'p1', name: 'Shop1', status: 'active' },
    ]);
    expect(result.available).toBe(true);
    expect(result.profiles).toHaveLength(1);
  });

  it('estimates token cost', () => {
    expect(estimateTokenCost(1000, 0.002)).toBe(0.002);
  });
});

describe('productFilters', () => {
  it('passes when metrics meet GMV/CTR thresholds', () => {
    const result = applyProductFilters(
      { id: '1', gmv: 5000, ctr: 0.05, source: 'taobao', imageCount: 9 },
      { minGmv: 1000, minCtr: 0.01, sources: ['taobao'], minImageCount: 9 },
    );
    expect(result.passed).toBe(true);
  });

  it('fails when CTR below threshold', () => {
    const result = applyProductFilters({ id: '1', ctr: 0.001 }, { minCtr: 0.01 });
    expect(result.passed).toBe(false);
    expect(result.failedRules[0]).toMatch(/ctr/);
  });
});
