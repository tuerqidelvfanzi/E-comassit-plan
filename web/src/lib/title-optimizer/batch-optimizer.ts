/**
 * 批量标题优化
 * 用途: CSV 上传 → 批量生成 → CSV 下载
 */
import { generateCandidates } from './candidate-generator';
import { getRule, type Platform, type Language } from './platform-rules';

export interface BatchRow {
  productName: string;
  keywords: string;
  brand?: string;
}

export interface BatchResult {
  input: BatchRow;
  recommended: string;
  score: number;
  success: boolean;
  error?: string;
}

export function parseCSV(csv: string): BatchRow[] {
  const lines = csv.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map(h => h.trim());
  const rows: BatchRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map(c => c.trim());
    if (cells.length < 2) continue;
    const row: BatchRow = { productName: '', keywords: '' };
    for (let j = 0; j < header.length; j++) {
      const k = header[j] as keyof BatchRow;
      if (k === 'productName' || k === 'keywords' || k === 'brand') {
        (row as any)[k] = cells[j] || '';
      }
    }
    if (row.productName) rows.push(row);
  }
  return rows;
}

export function exportToCSV(results: BatchResult[]): string {
  const header = 'productName,recommended,score,success,error\n';
  const rows = results.map(r => {
    const safe = (s: string) => '"' + s.replace(/"/g, '""') + '"';
    return [
      safe(r.input.productName),
      safe(r.recommended),
      String(r.score),
      String(r.success),
      safe(r.error || ''),
    ].join(',');
  });
  return header + rows.join('\n');
}

export async function batchOptimize(
  rows: BatchRow[],
  platform: Platform,
  language: Language,
  onProgress?: (done: number, total: number) => void
): Promise<BatchResult[]> {
  const total = rows.length;
  const results: BatchResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const candidates = generateCandidates({
        productName: row.productName,
        platform,
        language,
        keywords: row.keywords.split(/[,,]/).map(k => k.trim()).filter(Boolean),
        brand: row.brand,
      });
      const best = candidates[0];
      results.push({
        input: row,
        recommended: best?.title || row.productName,
        score: best?.score.totalScore || 0,
        success: true,
      });
    } catch (e) {
      results.push({
        input: row,
        recommended: row.productName,
        score: 0,
        success: false,
        error: (e as Error).message,
      });
    }
    if (onProgress) onProgress(i + 1, total);
  }

  return results;
}

export function validateBatchSize(rows: BatchRow[]): { valid: boolean; reason?: string } {
  if (rows.length === 0) return { valid: false, reason: 'CSV 为空' };
  if (rows.length > 100) return { valid: false, reason: '超过 100 行限制（当前 ' + rows.length + ' 行）' };
  return { valid: true };
}

export { getRule };
