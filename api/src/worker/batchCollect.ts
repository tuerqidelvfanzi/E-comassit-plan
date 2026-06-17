import { chromium, type Cookie } from 'playwright';
import { getDb } from '../db/index.js';
import { ingestCollect } from '../services/products.js';
import {
  appendAudit,
  getBatchJob,
  updateBatchStatus,
  type BatchCollectJob,
} from '../services/batchJobs.js';
import { getCookieJar, toPlaywrightCookies } from '../services/cookieJar.js';
import { EXTRACT_DETAIL_SCRIPT, EXTRACT_LIST_URLS_SCRIPT } from './extractDetail.js';

function randomDelay(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function detectCookieDomain(listUrl: string) {
  if (listUrl.includes('1688')) return '.1688.com';
  if (listUrl.includes('tmall')) return '.tmall.com';
  return '.taobao.com';
}

export async function runBatchCollectJob(jobId: string, userId: string) {
  if (process.env.ENABLE_BATCH_WORKER === 'false') {
    throw new Error('BATCH_WORKER_DISABLED');
  }

  const db = getDb();
  const job = getBatchJob(db, userId, jobId);
  if (!job) throw new Error('JOB_NOT_FOUND');
  if (job.status === 'running') return;
  if (job.status === 'done' || job.status === 'failed') return;

  const now = new Date().toISOString();
  updateBatchStatus(db, jobId, { status: 'running', started_at: now, error: null });
  appendAudit(db, jobId, { event: 'started', listUrl: job.list_url });

  const results: Array<{ url: string; ok: boolean; productId?: string; error?: string }> = [];
  let itemsDone = 0;
  let itemsFailed = 0;

  let browser;
  try {
    browser = await chromium.launch({
      headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
    });
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      locale: 'zh-CN',
    });

    if (job.use_cookies) {
      const domain = detectCookieDomain(job.list_url);
      const stored = getCookieJar(db, userId, domain.replace(/^\./, ''));
      const altDomain = domain.startsWith('.') ? domain.slice(1) : domain;
      const cookies =
        stored.length > 0 ? stored : getCookieJar(db, userId, altDomain);
      if (cookies.length > 0) {
        await context.addCookies(toPlaywrightCookies(cookies, domain) as Cookie[]);
        appendAudit(db, jobId, { event: 'cookies_loaded', count: cookies.length, domain });
      } else {
        appendAudit(db, jobId, { event: 'cookies_missing', domain });
      }
    }

    const listPage = await context.newPage();
    await listPage.goto(job.list_url, { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const bodyText = await listPage.content();
    if (/验证码|滑块|captcha|punish/i.test(bodyText)) {
      updateBatchStatus(db, jobId, {
        status: 'paused',
        error: 'captcha_required',
        finished_at: new Date().toISOString(),
      });
      appendAudit(db, jobId, { event: 'captcha_required' });
      return;
    }

    await listPage.evaluate(() => window.scrollBy(0, 800));
    await listPage.waitForTimeout(1500);

    let urls = (await listPage.evaluate(EXTRACT_LIST_URLS_SCRIPT)) as string[];
    urls = [...new Set(urls)].slice(0, job.max_items);

    if (urls.length === 0) {
      updateBatchStatus(db, jobId, {
        status: 'failed',
        error: 'no_urls_found',
        finished_at: new Date().toISOString(),
      });
      appendAudit(db, jobId, { event: 'no_urls_found' });
      return;
    }

    appendAudit(db, jobId, { event: 'urls_discovered', count: urls.length, urls });

    for (const url of urls) {
      await listPage.waitForTimeout(randomDelay(job.delay_ms_min, job.delay_ms_max));
      const detailPage = await context.newPage();
      try {
        await detailPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        await detailPage.evaluate(() => window.scrollBy(0, 400));
        await detailPage.waitForTimeout(800);

        const payload = (await detailPage.evaluate(EXTRACT_DETAIL_SCRIPT)) as {
          title?: string;
        } | null;
        if (!payload?.title) {
          throw new Error('selector_miss');
        }

        const { product } = ingestCollect(db, userId, payload as Record<string, unknown>);
        itemsDone += 1;
        results.push({ url, ok: true, productId: product.id });
        appendAudit(db, jobId, { event: 'item_ok', url, productId: product.id });
      } catch (e) {
        itemsFailed += 1;
        const reason = e instanceof Error ? e.message : 'unknown';
        results.push({ url, ok: false, error: reason });
        appendAudit(db, jobId, { event: 'item_fail', url, reason });
      } finally {
        await detailPage.close();
      }

      updateBatchStatus(db, jobId, {
        items_done: itemsDone,
        items_failed: itemsFailed,
        results_json: JSON.stringify(results),
      });
    }

    updateBatchStatus(db, jobId, {
      status: 'done',
      items_done: itemsDone,
      items_failed: itemsFailed,
      results_json: JSON.stringify(results),
      finished_at: new Date().toISOString(),
    });
    appendAudit(db, jobId, { event: 'finished', itemsDone, itemsFailed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'worker_crash';
    updateBatchStatus(db, jobId, {
      status: 'failed',
      error: msg,
      results_json: JSON.stringify(results),
      finished_at: new Date().toISOString(),
    });
    appendAudit(db, jobId, { event: 'crash', error: msg });
    throw e;
  } finally {
    await browser?.close();
  }
}

/** 本地/模拟：不启动浏览器，生成演示结果 */
export function simulateBatchCollectJob(jobId: string, userId: string) {
  const db = getDb();
  const job = getBatchJob(db, userId, jobId);
  if (!job) return;

  updateBatchStatus(db, jobId, { status: 'running', started_at: new Date().toISOString() });
  const results = Array.from({ length: Math.min(job.max_items, 3) }, (_, i) => ({
    url: `${job.list_url}#item-${i + 1}`,
    ok: true,
    productId: `sim-${jobId}-${i}`,
  }));
  updateBatchStatus(db, jobId, {
    status: 'done',
    items_done: results.length,
    items_failed: 0,
    results_json: JSON.stringify(results),
    finished_at: new Date().toISOString(),
  });
  appendAudit(db, jobId, { event: 'simulated', results });
}

export function scheduleBatchJob(jobId: string, userId: string) {
  const run = async () => {
    try {
      if (process.env.BATCH_WORKER_SIMULATE === 'true') {
        simulateBatchCollectJob(jobId, userId);
      } else {
        await runBatchCollectJob(jobId, userId);
      }
    } catch (e) {
      console.error('[batch-worker]', jobId, e);
    }
  };
  setImmediate(run);
}
