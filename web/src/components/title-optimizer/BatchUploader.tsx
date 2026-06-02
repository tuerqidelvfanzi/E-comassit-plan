/**
 * BatchUploader - 批量标题优化上传组件
 * 整合 batch-optimizer (parseCSV / batchOptimize / exportToCSV)
 */
import { useState, useRef } from 'react';
import { Card, Button } from '../ui';
import { parseCSV, exportToCSV, validateBatchSize, batchOptimize, type BatchResult } from '../../lib/title-optimizer/batch-optimizer';
import type { Platform, Language } from '../../lib/title-optimizer/platform-rules';

interface Props {
  platform: Platform;
  language: Language;
}

export function BatchUploader({ platform, language }: Props) {
  const [results, setResults] = useState<BatchResult[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('CSV 文件超过 5MB 限制');
      return;
    }
    const text = await file.text();
    const rows = parseCSV(text);
    const validation = validateBatchSize(rows);
    if (!validation.valid) {
      setError(validation.reason || '校验失败');
      return;
    }
    setError('');
    setRunning(true);
    setProgress({ done: 0, total: rows.length });
    try {
      const result = await batchOptimize(rows, platform, language, (done, total) => {
        setProgress({ done, total });
      });
      setResults(result);
    } finally {
      setRunning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function downloadCSV() {
    const csv = exportToCSV(results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'title-optimization-results.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <h3 className="text-base font-medium mb-2">批量优化</h3>
      <p className="text-xs text-[var(--color-text-muted)] mb-3">
        CSV 格式：productName,keywords,brand （最多 100 行）
      </p>
      <div className="flex items-center gap-2">
        <label className="px-3 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-fg)] cursor-pointer text-sm">
          📤 上传 CSV
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="hidden"
            disabled={running}
          />
        </label>
        {results.length > 0 && (
          <Button variant="outline" onClick={downloadCSV}>
            下载结果 ({results.length})
          </Button>
        )}
      </div>
      {running && (
        <div className="mt-3 text-sm">
          处理中: {progress.done} / {progress.total}
          <div className="w-full bg-gray-200 rounded h-2 mt-1">
            <div
              className="bg-[var(--color-primary)] h-2 rounded"
              style={{ width: (progress.done / Math.max(1, progress.total) * 100) + '%' }}
            />
          </div>
        </div>
      )}
      {error && <div className="mt-2 text-sm text-[var(--color-danger)]">{error}</div>}
      {results.length > 0 && !running && (
        <div className="mt-3 text-xs text-[var(--color-text-muted)]">
          完成 {results.length} 行 · 成功率 {Math.round(results.filter(r => r.success).length / results.length * 100)}%
        </div>
      )}
    </Card>
  );
}
