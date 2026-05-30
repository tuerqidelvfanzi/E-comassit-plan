import { uid } from '../lib/response.js';
import type { TitleComparison, TitleOptimizationJob, TitleSearchTermRow } from './types.js';

type UserTitleJobs = { jobs: TitleOptimizationJob[] };

const stores = new Map<string, UserTitleJobs>();

function getJobs(userId: string): TitleOptimizationJob[] {
  let s = stores.get(userId);
  if (!s) {
    s = { jobs: [] };
    stores.set(userId, s);
  }
  return s.jobs;
}

function touch(job: TitleOptimizationJob) {
  job.updatedAt = new Date().toISOString();
}

function mockSearchTerms(categoryName: string): TitleSearchTermRow[] {
  const base = categoryName.replace(/\s/g, '') || '类目';
  return [
    { keyword: `${base} 静音`, metrics: '搜索人气 12.8万 · 7天' },
    { keyword: `${base} 家用`, metrics: '搜索人气 9.2万 · 7天' },
    { keyword: `${base} 节能`, metrics: '搜索人气 7.1万 · 7天' },
    { keyword: `${base} 落地`, metrics: '搜索人气 5.4万 · 7天' },
    { keyword: `${base} 遥控`, metrics: '搜索人气 4.8万 · 7天' },
  ];
}

function mockGeneratedTitle(categoryName: string, terms: TitleSearchTermRow[]): string {
  const hot = terms[0]?.keyword.split(/\s+/).pop() ?? '爆款';
  return `${categoryName}${hot}家用节能落地扇遥控定时`;
}

function mockComparison(original: string, suggested: string): TitleComparison {
  return {
    originalTitle: original,
    originalScore: '人气分 3.2万',
    suggestedTitle: suggested,
    suggestedScore: '人气分 5.8万（预估）',
    wordsToRemove: ['包邮', '厂家直销', '2024新款'],
    wordsToAdd: ['静音', '节能', '遥控'],
    otherSuggestions: [
      '将品类核心词前置，符合天猫搜索习惯',
      '删除促销承诺类词汇，降低违规风险',
      '控制标题长度在平台建议范围内',
    ],
  };
}

export const titleOptimizationStore = {
  list(userId: string) {
    return getJobs(userId);
  },

  get(userId: string, id: string) {
    return getJobs(userId).find((j) => j.id === id) ?? null;
  },

  create(userId: string, categoryName: string, tmallProductId: string) {
    const now = new Date().toISOString();
    const job: TitleOptimizationJob = {
      id: uid('tto'),
      categoryName: categoryName.trim(),
      tmallProductId: tmallProductId.trim(),
      status: 'created',
      currentStep: 1,
      workerNote:
        '演示环境：搜索词与商家后台读写为示例数据；正式版由 Playwright Worker 连接生意参谋与天猫卖家中心。',
      createdAt: now,
      updatedAt: now,
    };
    getJobs(userId).unshift(job);
    return job;
  },

  collectSearchTerms(userId: string, id: string) {
    const job = this.get(userId, id);
    if (!job) return null;
    job.searchTerms = mockSearchTerms(job.categoryName);
    job.status = 'search_terms_ready';
    job.currentStep = Math.max(job.currentStep, 2);
    touch(job);
    return job;
  },

  generateTitle(userId: string, id: string) {
    const job = this.get(userId, id);
    if (!job) return null;
    if (!job.searchTerms?.length) {
      job.searchTerms = mockSearchTerms(job.categoryName);
    }
    job.generatedTitle = mockGeneratedTitle(job.categoryName, job.searchTerms);
    job.status = 'title_generated';
    job.currentStep = Math.max(job.currentStep, 3);
    touch(job);
    return job;
  },

  fetchOriginal(userId: string, id: string) {
    const job = this.get(userId, id);
    if (!job) return null;
    job.originalTitle = `【厂家直销】${job.categoryName}包邮新款 ID${job.tmallProductId.slice(-4)}`;
    job.originalScore = '人气分 3.2万';
    job.status = 'original_fetched';
    job.currentStep = Math.max(job.currentStep, 4);
    touch(job);
    return job;
  },

  compare(userId: string, id: string) {
    const job = this.get(userId, id);
    if (!job) return null;
    const suggested = job.generatedTitle ?? mockGeneratedTitle(job.categoryName, job.searchTerms ?? []);
    const original = job.originalTitle ?? `【厂家直销】${job.categoryName}包邮`;
    job.comparison = mockComparison(original, suggested);
    job.suggestedTitle = job.comparison.suggestedTitle;
    job.status = 'awaiting_confirm';
    job.currentStep = Math.max(job.currentStep, 5);
    touch(job);
    return job;
  },

  apply(userId: string, id: string, confirmed: boolean) {
    const job = this.get(userId, id);
    if (!job) return null;
    if (!confirmed) {
      job.status = 'cancelled';
      touch(job);
      return job;
    }
    if (!job.comparison) {
      this.compare(userId, id);
    }
    job.status = 'applying';
    job.currentStep = 7;
    touch(job);
    job.status = 'completed';
    job.appliedAt = new Date().toISOString();
    job.verificationNote =
      '演示：已模拟在天猫卖家后台完成标题提交。正式版将截图并回读标题文本校验。';
    touch(job);
    return job;
  },
};
