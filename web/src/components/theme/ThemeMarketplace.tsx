/**
 * ThemeMarketplace - 主题市场页面
 * 展示内置 + 用户主题，支持导入导出
 */
import React, { useState } from 'react';
import { useThemeMarket } from '../../hooks/useThemeMarket';
import { ThemePreview } from './ThemePreview';
import { importTheme, exportTheme } from '../../lib/theme-storage';
import { Button, Card } from '../ui';

export function ThemeMarketplace() {
  const { allPresets, userPresets, activeId, setActive, addUserTheme, removeUserTheme, cloneFromPreset } = useThemeMarket();
  const [tab, setTab] = useState<'builtIn' | 'user'>('builtIn');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [importError, setImportError] = useState('');

  // Bug-7 fix: useMemo 避免每次 render 重算
  const list = React.useMemo(() => {
    return (tab === 'builtIn' ? allPresets : userPresets)
      .filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  }, [allPresets, userPresets, tab, search]);

  function handleExport(themeId: string) {
    const theme = allPresets.find(t => t.id === themeId);
    if (!theme) return;
    const json = exportTheme(theme);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Bug-5 fix: sanitize 文件名
    a.download = theme.name.replace(/[\\/:*?"<>|]/g, '_') + '.theme.json';
    a.click();
    URL.revokeObjectURL(url);
    setMsg('已导出: ' + theme.name);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Bug-4 fix: 限制文件大小 1MB
    if (file.size > 1024 * 1024) {
      setImportError('文件超过 1MB 限制');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const theme = importTheme(String(reader.result));
        // Bug-2 fix: ID 冲突检测
        const exists = allPresets.some(t => t.id === theme.id);
        const finalTheme = exists
          ? { ...theme, id: 'user-' + Date.now().toString(36), name: theme.name + ' (导入)' }
          : theme;
        addUserTheme(finalTheme);
        setImportError('');
        setMsg('已导入: ' + finalTheme.name);
      } catch (err) {
        setImportError('导入失败: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleDelete(themeId: string, themeName: string) {
    // Bug-3 fix: 删除二次确认
    if (!window.confirm('确认删除主题 "' + themeName + '"？此操作不可撤销。')) return;
    removeUserTheme(themeId);
    setMsg('已删除: ' + themeName);
  }

  function handleClone(themeId: string) {
    const name = window.prompt('为派生主题命名：', '我的主题');
    if (!name) return;
    const cloned = cloneFromPreset(themeId, name);
    if (cloned) {
      addUserTheme(cloned);
      setMsg('已创建派生主题: ' + name);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="🔍 搜索主题..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
        />
        <label className="px-3 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-fg)] cursor-pointer">
          📥 导入
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant={tab === 'builtIn' ? 'primary' : 'outline'} onClick={() => setTab('builtIn')}>
          预设主题 ({allPresets.length - userPresets.length})
        </Button>
        <Button size="sm" variant={tab === 'user' ? 'primary' : 'outline'} onClick={() => setTab('user')}>
          我的主题 ({userPresets.length})
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {list.map(theme => (
          <Card key={theme.id} className="p-3">
            <ThemePreview
              theme={theme}
              selected={activeId === theme.id}
              onClick={() => setActive(theme.id)}
            />
            <div className="mt-2 text-sm font-medium">{theme.name}</div>
            <div className="text-xs text-[var(--color-text-muted)]">
              {theme.author} · v{theme.version}
            </div>
            <div className="flex gap-1 mt-2">
              <Button size="sm" variant="outline" onClick={() => handleExport(theme.id)}>
                导出
              </Button>
              {tab === 'builtIn' && (
                <Button size="sm" variant="outline" onClick={() => handleClone(theme.id)}>
                  派生
                </Button>
              )}
              {tab === 'user' && (
                <Button size="sm" variant="outline" onClick={() => handleDelete(theme.id, theme.name)}>
                  删除
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {msg && <p className="text-sm text-[var(--color-primary)]">{msg}</p>}
      {importError && <p className="text-sm text-[var(--color-danger)]">{importError}</p>}
    </div>
  );
}
