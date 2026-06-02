/**
 * ThemeImportExport - 独立的导入导出组件
 * 从 ThemeMarketplace 拆出，符合 SPEC-B F-B3
 */
import { useState } from 'react';
import { Button, Card } from '../ui';
import { importTheme, exportTheme } from '../../lib/theme-storage';
import type { ThemePackage } from '../../types/theme-package';

interface Props {
  allPresets: ThemePackage[];
  onImport: (theme: ThemePackage) => void;
  onMessage: (msg: string) => void;
  onError: (err: string) => void;
}

export function ThemeImportExport({ allPresets, onImport, onMessage, onError }: Props) {
  const [importing, setImporting] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      onError('文件超过 1MB 限制');
      e.target.value = '';
      return;
    }
    setImporting(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const theme = importTheme(String(reader.result));
        const exists = allPresets.some(t => t.id === theme.id);
        const finalTheme = exists
          ? { ...theme, id: 'user-' + Date.now().toString(36), name: theme.name + ' (导入)' }
          : theme;
        onImport(finalTheme);
        onMessage('已导入: ' + finalTheme.name);
      } catch (err) {
        onError('导入失败: ' + (err as Error).message);
      } finally {
        setImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  function handleExport() {
    if (!selectedId) {
      onError('请先选择要导出的主题');
      return;
    }
    const theme = allPresets.find(t => t.id === selectedId);
    if (!theme) return;
    const json = exportTheme(theme);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = theme.name.replace(/[\/:*?"<>|]/g, '_') + '.theme.json';
    a.click();
    URL.revokeObjectURL(url);
    onMessage('已导出: ' + theme.name);
  }

  return (
    <Card>
      <h3 className="text-base font-medium mb-3">导入 / 导出</h3>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">从 JSON 导入</label>
          <div className="mt-1">
            <label className="inline-block px-3 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-fg)] cursor-pointer text-sm">
              {importing ? '导入中...' : '📥 选择文件'}
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileImport}
                className="hidden"
                disabled={importing}
              />
            </label>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">导出为 JSON</label>
          <div className="mt-1 flex gap-2">
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <option value="">选择主题...</option>
              {allPresets.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.author})</option>
              ))}
            </select>
            <Button onClick={handleExport} disabled={!selectedId}>
              导出
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
