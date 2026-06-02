/**
 * 竞品标题抓取与分析
 * 复用 Playwright（已有依赖）
 * 设计: 防错式 - 超时/失败不阻塞主流程
 */
import { getRule, type Platform } from './platform-rules';

export interface CompetitorTitle {
  url: string;
  title: string;
  length: number;
  fetchTime: number;
}

export interface CompetitorGap {
  url: string;
  title: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  uniqueKeywords: string[];
}

const SCRAPE_TIMEOUT = 8000;
const MAX_CONCURRENT = 3;

export async function fetchCompetitorTitle(
  url: string,
  platform: Platform
): Promise<CompetitorTitle> {
  // 简化实现：使用 fetch 抓 HTML，提取 <title>
  // 实际生产环境用 Playwright（项目已安装）
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const html = await res.text();

    // 平台差异化提取
    const title = extractTitle(html, platform);
    return {
      url,
      title,
      length: title.length,
      fetchTime: Date.now(),
    };
  } finally {
    clearTimeout(timer);
  }
}

function extractTitle(html: string, platform: Platform): string {
  // 各平台标题选择器（简化版）
  const patterns: Record<Platform, RegExp> = {
    amazon: /<span id="productTitle"[^>]*>([^<]+)<\/span>/i,
    ebay: /<h1[^>]*class="product-title"[^>]*>([^<]+)<\/h1>/i,
    shopee: /<div[^>]*class="[^"]*product-title[^"]*"[^>]*>([^<]+)<\/div>/i,
    tiktok: /<h1[^>]*data-testid="product-title"[^>]*>([^<]+)<\/h1>/i,
    lazada: /<h1[^>]*class="pdp-mod-product-badge-title"[^>]*>([^<]+)<\/h1>/i,
  };

  const match = html.match(patterns[platform]);
  if (match) return match[1].trim().replace(/\s+/g, ' ');

  // Fallback: <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : '';
}

export async function fetchCompetitorTitles(
  urls: string[],
  platform: Platform
): Promise<CompetitorTitle[]> {
  // 限频：最多 3 并发
  const results: CompetitorTitle[] = [];
  for (let i = 0; i < urls.length; i += MAX_CONCURRENT) {
    const batch = urls.slice(i, i + MAX_CONCURRENT);
    const settled = await Promise.allSettled(
      batch.map(url => fetchCompetitorTitle(url, platform))
    );
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value.title) {
        results.push(r.value);
      }
    }
  }
  return results;
}

export function analyzeGaps(
  myKeywords: string[],
  competitor: CompetitorTitle
): CompetitorGap {
  const lowerTitle = competitor.title.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];
  for (const kw of myKeywords) {
    if (lowerTitle.includes(kw.toLowerCase())) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  }
  // 竞品独特词（粗略提取 4+ 字符的词）
  const tokens = competitor.title.split(/[\s\-,|]+/).filter(t => t.length >= 4);
  const uniqueKeywords = Array.from(new Set(tokens))
    .filter(t => !myKeywords.some(kw => t.toLowerCase().includes(kw.toLowerCase())))
    .slice(0, 10);

  return {
    url: competitor.url,
    title: competitor.title,
    matchedKeywords: matched,
    missingKeywords: missing,
    uniqueKeywords,
  };
}
