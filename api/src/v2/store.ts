import { uid } from '../lib/response.js';
import type {
  CompetitorJob,
  LinkCollectJob,
  PipelineRunV2,
  PublishTaskV2,
  TargetLocale,
} from './types.js';
import {
  buildInsightsDashboard,
  buildOverview,
  mockReport,
  seedCompetitorJobs,
  seedLinkCollectJobs,
  seedOpenApi,
  seedPublishAdapters,
  seedPublishTasks,
  seedTeam,
  seedTemplateCatalog,
} from './seed.js';

type UserStore = {
  competitorJobs: CompetitorJob[];
  linkCollectJobs: LinkCollectJob[];
  publishTasks: PublishTaskV2[];
  pipelineRuns: PipelineRunV2[];
};

const stores = new Map<string, UserStore>();

function getStore(userId: string): UserStore {
  let s = stores.get(userId);
  if (!s) {
    s = {
      competitorJobs: seedCompetitorJobs(),
      linkCollectJobs: seedLinkCollectJobs(),
      publishTasks: seedPublishTasks(),
      pipelineRuns: [],
    };
    stores.set(userId, s);
  }
  return s;
}

export const v2Store = {
  overview(userId: string, totalProducts: number) {
    return buildOverview({ totalProducts });
  },

  templateCatalog() {
    return seedTemplateCatalog();
  },

  publishAdapters() {
    return seedPublishAdapters();
  },

  team() {
    return seedTeam();
  },

  openApiIntegrations() {
    return seedOpenApi();
  },

  insightsDashboard(userId: string) {
    return buildInsightsDashboard(getStore(userId).competitorJobs);
  },

  listCompetitorJobs(userId: string) {
    return getStore(userId).competitorJobs;
  },

  createCompetitorJob(userId: string, keyword: string, sourcePlatform: string) {
    const now = new Date().toISOString();
    const job: CompetitorJob = {
      id: uid('cmp'),
      keyword,
      sourcePlatform,
      status: 'idle',
      createdAt: now,
      updatedAt: now,
    };
    getStore(userId).competitorJobs.unshift(job);
    return job;
  },

  runCompetitorJob(userId: string, id: string) {
    const job = getStore(userId).competitorJobs.find((j) => j.id === id);
    if (!job) return null;
    job.status = 'running';
    job.updatedAt = new Date().toISOString();
    job.status = 'done';
    job.report = mockReport(job.keyword);
    job.updatedAt = new Date().toISOString();
    return job;
  },

  getCompetitorJob(userId: string, id: string) {
    return getStore(userId).competitorJobs.find((j) => j.id === id) ?? null;
  },

  listLinkCollectJobs(userId: string) {
    return getStore(userId).linkCollectJobs;
  },

  createLinkCollect(userId: string, url: string) {
    const now = new Date().toISOString();
    let platform = '链接';
    if (url.includes('taobao') || url.includes('tmall')) platform = '淘宝';
    else if (url.includes('1688')) platform = '1688';
    else if (url.includes('yangkeduo') || url.includes('pinduoduo')) platform = '拼多多';
    else if (url.includes('douyin')) platform = '抖音';

    const job: LinkCollectJob = {
      id: uid('lnk'),
      url,
      sourcePlatform: platform,
      status: 'queued',
      progress: 0,
      createdAt: now,
    };
    getStore(userId).linkCollectJobs.unshift(job);

    job.status = 'running';
    job.progress = 40;
    job.message = 'Mock Worker：Playwright 解析页面结构…';
    job.status = 'done';
    job.progress = 100;
    job.message = 'Mock 完成，可导入采集箱';
    job.productPreview = {
      title: `直采商品 · ${platform}`,
      priceCny: 19.9 + Math.floor(Math.random() * 30),
      thumb: 'https://placehold.co/80x80/gray/white?text=直采',
      skuCount: 6 + Math.floor(Math.random() * 6),
    };
    return job;
  },

  listPublishTasksV2(userId: string) {
    return getStore(userId).publishTasks;
  },

  simulatePublishFill(userId: string, id: string) {
    const task = getStore(userId).publishTasks.find((t) => t.id === id);
    if (!task) return null;
    const now = new Date().toISOString();
    task.status = 'filling';
    task.updatedAt = now;
    task.status = Math.random() > 0.15 ? 'completed' : 'failed';
    if (task.status === 'failed') {
      task.reason = 'Mock：DOM 节点未匹配，已写入演示日志';
    } else {
      task.reason = undefined;
    }
    task.updatedAt = new Date().toISOString();
    return { task, log: `[Mock] ${task.platform} ${task.locale} 填表模拟完成` };
  },

  createPublishTaskV2(
    userId: string,
    data: {
      title: string;
      platform: string;
      locale: TargetLocale;
      productId?: string;
      adapterId: string;
    },
  ) {
    const now = new Date().toISOString();
    const task: PublishTaskV2 = {
      id: uid('pubv2'),
      ...data,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
    getStore(userId).publishTasks.unshift(task);
    return task;
  },

  runPipelineV2(
    userId: string,
    productId: string,
    templateId: string,
    locale: TargetLocale,
    adhocPrompt?: string,
  ): PipelineRunV2 {
    const run: PipelineRunV2 = {
      id: uid('run'),
      productId,
      templateId,
      locale,
      status: 'done',
      mock: true,
      exposure: {
        title: locale === 'vi-VN' ? 'A04蓝熊纯棉T恤' : 'เสื้อยืดน่ารัก ผ้าฝ้าย',
        shortDescription: locale === 'vi-VN' ? '纯棉透气童T' : 'นุ่ม ใส่สบาย',
        priceLabel: locale === 'vi-VN' ? '₫99,750' : '฿259',
      },
      conversion: {
        title: locale === 'vi-VN' ? '童T纯棉 蓝熊款' : '👕 เสื้อเด็ก ลายหมี',
        shortDescription: locale === 'vi-VN' ? '可爱蓝熊印花' : 'ลายการ์ตูน',
        priceLabel: locale === 'vi-VN' ? '₫95,000' : '฿249',
      },
      skus: [
        { skuCode: 'BF-0001-PR-WH-S', color: 'WH', size: 'S', price: 400, stock: 50 },
        { skuCode: 'BF-0002-PR-BK-M', color: 'BK', size: 'M', price: 400, stock: 50 },
        { skuCode: 'BF-9999-P-WH-L', color: 'WH', size: 'L', price: 400, stock: 5 },
      ],
      warnings: adhocPrompt ? ['Mock：已合并临时提示词'] : [],
      ranAt: new Date().toISOString(),
    };
    getStore(userId).pipelineRuns.unshift(run);
    return run;
  },

  listPipelineRuns(userId: string, productId: string) {
    return getStore(userId).pipelineRuns.filter((r) => r.productId === productId);
  },
};
