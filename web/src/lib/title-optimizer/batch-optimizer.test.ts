import { describe, it, expect } from 'vitest';
import { parseCSV, exportToCSV, validateBatchSize, batchOptimize } from './batch-optimizer';

describe('parseCSV', () => {
  it('解析标准 CSV', () => {
    const csv = 'productName,keywords,brand\nTest Product,wireless bluetooth,Sony';
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].productName).toBe('Test Product');
    expect(rows[0].keywords).toBe('wireless bluetooth');
    expect(rows[0].brand).toBe('Sony');
  });

  it('空 CSV 返回空', () => {
    expect(parseCSV('')).toEqual([]);
  });

  it('只有表头返回空', () => {
    expect(parseCSV('productName,keywords')).toEqual([]);
  });

  it('多个数据行', () => {
    const csv = 'productName,keywords\nA,kw1\nB,kw2\nC,kw3';
    expect(parseCSV(csv)).toHaveLength(3);
  });
});

describe('exportToCSV', () => {
  it('转义引号', () => {
    const csv = exportToCSV([{
      input: { productName: 'a"b', keywords: 'k' },
      recommended: 'A "B" C',
      score: 80,
      success: true,
    }]);
    expect(csv).toContain('"a""b"');
    expect(csv).toContain('"A ""B"" C"');
  });

  it('空结果只有表头', () => {
    const csv = exportToCSV([]);
    expect(csv).toBe('productName,recommended,score,success,error\n');
  });
});

describe('validateBatchSize', () => {
  it('空 CSV 拒绝', () => {
    expect(validateBatchSize([]).valid).toBe(false);
  });

  it('超过 100 行拒绝', () => {
    const rows = Array(101).fill({ productName: 'x', keywords: 'k' });
    expect(validateBatchSize(rows).valid).toBe(false);
  });

  it('合法大小通过', () => {
    const rows = Array(50).fill({ productName: 'x', keywords: 'k' });
    expect(validateBatchSize(rows).valid).toBe(true);
  });

  it('刚好 100 行通过', () => {
    const rows = Array(100).fill({ productName: 'x', keywords: 'k' });
    expect(validateBatchSize(rows).valid).toBe(true);
  });
});

describe('batchOptimize', () => {
  it('批量处理 2 行', async () => {
    const results = await batchOptimize(
      [
        { productName: 'Product 1', keywords: 'wireless' },
        { productName: 'Product 2', keywords: 'bluetooth' },
      ],
      'amazon',
      'en'
    );
    expect(results).toHaveLength(2);
    expect(results.every(r => r.success)).toBe(true);
  });

  it('进度回调被调用', async () => {
    const calls: number[] = [];
    await batchOptimize(
      [
        { productName: 'A', keywords: 'k' },
        { productName: 'B', keywords: 'k' },
      ],
      'amazon',
      'en',
      (done) => calls.push(done)
    );
    expect(calls).toEqual([1, 2]);
  });

  it('空输入返回空', async () => {
    const results = await batchOptimize([], 'amazon', 'en');
    expect(results).toEqual([]);
  });
});
