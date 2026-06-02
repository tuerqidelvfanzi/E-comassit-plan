/**
 * CompetitorAnalysis - 竞品标题对比组件
 * 整合 competitor-fetcher + analyzeGaps
 */
import { useState } from 'react';
import { Card, Button } from '../ui';
import { fetchCompetitorTitles, analyzeGaps, type CompetitorTitle, type CompetitorGap } from '../../lib/title-optimizer/competitor-fetcher';
import type { Platform } from '../../lib/title-optimizer/platform-rules';

interface Props {
  myKeywords: string[];
  platform: Platform;
}

export function CompetitorAnalysis({ myKeywords, platform }: Props) {
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CompetitorGap[]>([]);
  const [error, setError] = useState('');

  async function handleAnalyze() {
    const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);
    if (urlList.length === 0) {
      setError('请输入至少一个 URL');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const titles = await fetchCompetitorTitles(urlList, platform);
      const gaps = titles.map(t => analyzeGaps(myKeywords, t));
      setResults(gaps);
      if (gaps.length === 0) setError('未能成功抓取任何竞品标题');
    } catch (e) {
      setError('分析失败: ' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 className="text-base font-medium mb-2">竞品标题对比</h3>
      <p className="text-xs text-[var(--color-text-muted)] mb-3">
        粘贴竞品 URL（每行一个，最多 9 个），分析关键词 gap
      </p>
      <textarea
        value={urls}
        onChange={e => setUrls(e.target.value)}
        placeholder="https://amazon.com/product-1&#10;https://amazon.com/product-2"
        className="w-full px-3 py-2 border rounded text-sm font-mono"
        style={{ borderColor: 'var(--color-border)' }}
        rows={4}
      />
      <div className="mt-2 flex items-center gap-2">
        <Button onClick={handleAnalyze} disabled={loading || !urls}>
          {loading ? '抓取中...' : '🔍 分析竞品'}
        </Button>
        {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
      </div>
      {results.length > 0 && (
        <div className="mt-4 space-y-3">
          {results.map((r, i) => (
            <div key={i} className="border rounded p-3" style={{ borderColor: 'var(--color-border)' }}>
              <div className="text-xs text-[var(--color-text-muted)] truncate">{r.url}</div>
              <div className="font-medium text-sm mt-1">{r.title}</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[var(--color-success)]">✓ 已匹配</div>
                  <div>{r.matchedKeywords.join(', ') || '(无)'}</div>
                </div>
                <div>
                  <div className="text-[var(--color-danger)]">✗ 缺失</div>
                  <div>{r.missingKeywords.join(', ') || '(无)'}</div>
                </div>
              </div>
              {r.uniqueKeywords.length > 0 && (
                <div className="mt-2 text-xs">
                  <span className="text-[var(--color-primary)]">💡 竞品独特词：</span>
                  {r.uniqueKeywords.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
