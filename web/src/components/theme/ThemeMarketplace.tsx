/**
 * ThemeMarketplace - 主题市场页面
 * 展示内置 + 用户主题，支持导入导出
 */
import { useState } from 'react';
import { useThemeMarket } from '../../hooks/useThemeMarket';
import { ThemePreview } from './ThemePreview';
import { importTheme, exportTheme } from '../../lib/theme-storage';
import { Button, Card } from '../ui';

export function ThemeMarketplace() {
  const { allPresets, userPresets, activeId, setActive, addUserTheme, removeUserTheme } = useThemeMarket();
  const [tab, setTab] = useState<'builtIn' | 'user'>('builtIn');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');

  const list = (tab === 'builtIn' ? allPresets : userPresets)
    .filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  function handleExport(themeId: string) {
    const theme = allPresets.find(t => t.id === themeId);
    if (!theme) return;
    const json = exportTheme(theme);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = theme.name + '.theme.json';
    a.click();
    URL.revokeObjectURL(url);
    setMsg('已导出: ' + theme.name);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const theme = importTheme(String(reader.result));
        addUserTheme(theme);
        setMsg('已导入: ' + theme.name);
      } catch (err) {
        setMsg('导入失败: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
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
              {tab === 'user' && (
                <Button size="sm" variant="outline" onClick={() => removeUserTheme(theme.id)}>
                  删除
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {msg && <p className="text-sm text-[var(--color-primary)]">{msg}</p>}
    </div>
  );
}
