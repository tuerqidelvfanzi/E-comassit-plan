/**
 * TitleOptimizerV2 - V4.0 多平台 AI 标题优化器
 * 整合: platform-rules + seo-scorer + candidate-generator
 */
import { useState, useMemo } from 'react';
import { Card, Button } from '../components/ui';
import { PLATFORM_RULES, type Platform, type Language } from '../lib/title-optimizer/platform-rules';
import { generateCandidates, type TitleCandidate } from '../lib/title-optimizer/candidate-generator';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'es', label: 'Español' },
];

const PLATFORMS: Platform[] = ['amazon', 'ebay', 'shopee', 'tiktok', 'lazada'];

export function TitleOptimizerV2() {
  const [productName, setProductName] = useState('Premium Wireless Earbuds');
  const [platform, setPlatform] = useState<Platform>('amazon');
  const [language, setLanguage] = useState<Language>('en');
  const [keywords, setKeywords] = useState('wireless,bluetooth,earbuds');
  const [brand, setBrand] = useState('');
  const [candidates, setCandidates] = useState<TitleCandidate[]>([]);
  const [recommended, setRecommended] = useState<number>(-1);

  const rule = PLATFORM_RULES[platform];
  const keywordList = useMemo(
    () => keywords.split(/[,，]/).map(k => k.trim()).filter(Boolean),
    [keywords]
  );

  function handleOptimize() {
    const results = generateCandidates({
      productName,
      platform,
      language,
      keywords: keywordList,
      brand: brand || undefined,
    });
    setCandidates(results);
    setRecommended(0);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">AI 标题优化器 V2</h1>
      <p className="text-sm text-[var(--color-text-muted)]">
        多平台适配 · SEO 评分 · 候选生成
      </p>

      <Card>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">产品名</label>
            <input
              type="text"
              value={productName}
              onChange={e => setProductName(e.target.value)}
              className="w-full px-3 py-2 border rounded mt-1"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">平台</label>
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value as Platform)}
                className="w-full px-3 py-2 border rounded mt-1"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {PLATFORMS.map(p => (
                  <option key={p} value={p}>{p} (≤{PLATFORM_RULES[p].maxLength})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">语言</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value as Language)}
                className="w-full px-3 py-2 border rounded mt-1"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {LANGUAGES.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">关键词 (逗号分隔)</label>
            <input
              type="text"
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              className="w-full px-3 py-2 border rounded mt-1"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>

          <div>
            <label className="text-sm font-medium">品牌 (可选)</label>
            <input
              type="text"
              value={brand}
              onChange={e => setBrand(e.target.value)}
              className="w-full px-3 py-2 border rounded mt-1"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>

          <div className="text-xs text-[var(--color-text-muted)]">
            平台规则: {rule.notes} · 长度 {rule.minLength}-{rule.maxLength} 字符
          </div>

          <Button onClick={handleOptimize} disabled={!productName}>
            🚀 生成候选
          </Button>
        </div>
      </Card>

      {candidates.length > 0 && (
        <Card>
          <h2 className="text-lg font-medium mb-3">候选标题 ({candidates.length})</h2>
          <div className="space-y-3">
            {candidates.map((c, i) => (
              <div
                key={i}
                className="p-3 border rounded-lg"
                style={{
                  borderColor: i === recommended ? 'var(--color-primary)' : 'var(--color-border)',
                  background: i === recommended ? 'var(--color-primary-soft)' : 'transparent',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded" style={{
                        background: c.score.totalScore >= 80 ? 'var(--color-success)' : 'var(--color-warn)',
                        color: 'white',
                      }}>
                        {c.score.totalScore} 分
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {c.strategy}
                      </span>
                      {i === recommended && <span className="text-xs text-[var(--color-primary)]">✓ 推荐</span>}
                    </div>
                    <div className="mt-2 font-medium">{c.title}</div>
                    <div className="mt-1 grid grid-cols-4 gap-2 text-xs">
                      <div>密度: <b>{c.score.scores.density}</b></div>
                      <div>长度: <b>{c.score.scores.length}</b></div>
                      <div>多样: <b>{c.score.scores.diversity}</b></div>
                      <div>位置: <b>{c.score.scores.keywordPosition}</b></div>
                    </div>
                    {c.score.warnings.length > 0 && (
                      <div className="mt-2 text-xs text-[var(--color-danger)]">
                        ⚠️ {c.score.warnings.join('; ')}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="sm" variant="outline" onClick={() => setRecommended(i)}>
                      推荐
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(c.title)}>
                      复制
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
