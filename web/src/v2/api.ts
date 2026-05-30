import { resolveApiMode } from '../lib/api';
import { getApiBaseUrl, getStoredToken } from '../lib/api/httpClient';
import { v2ApiLocal } from './api-local';
import type {
  CompetitorJob,
  InsightsDashboardV2,
  LinkCollectJob,
  OpenApiIntegration,
  PipelineRunV2,
  PublishAdapter,
  PublishTaskV2,
  TeamMember,
  TemplateCatalogItem,
  TargetLocale,
  V2Overview,
} from './types';

type Envelope<T> = { code: number; message: string; data: T };

async function v2Request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}/api/v1/v2${path}`;
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  const token = getStoredToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers });
  const json = (await res.json()) as Envelope<T>;
  if (!res.ok || json.code !== 0) throw new Error(json.message || `HTTP ${res.status}`);
  return json.data;
}

const v2ApiHttp = {
  getOverview() {
    return v2Request<V2Overview>('/overview');
  },
  getTemplateCatalog() {
    return v2Request<TemplateCatalogItem[]>('/templates/catalog');
  },
  getPublishAdapters() {
    return v2Request<PublishAdapter[]>('/publish/adapters');
  },
  getTeamMembers() {
    return v2Request<TeamMember[]>('/team/members');
  },
  getOpenApiIntegrations() {
    return v2Request<OpenApiIntegration[]>('/integrations/open-api');
  },
  getInsightsDashboard() {
    return v2Request<InsightsDashboardV2>('/insights/dashboard');
  },
  listCompetitorJobs() {
    return v2Request<CompetitorJob[]>('/competitor-jobs');
  },
  createCompetitorJob(keyword: string, sourcePlatform: string) {
    return v2Request<CompetitorJob>('/competitor-jobs', {
      method: 'POST',
      body: JSON.stringify({ keyword, sourcePlatform }),
    });
  },
  runCompetitorJob(id: string) {
    return v2Request<CompetitorJob>(`/competitor-jobs/${id}/run`, { method: 'POST' });
  },
  listLinkCollect() {
    return v2Request<LinkCollectJob[]>('/link-collect');
  },
  createLinkCollect(url: string) {
    return v2Request<LinkCollectJob>('/link-collect', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  },
  listPublishTasks() {
    return v2Request<PublishTaskV2[]>('/publish/tasks');
  },
  simulatePublishFill(id: string) {
    return v2Request<{ task: PublishTaskV2; log: string }>(`/publish/tasks/${id}/simulate-fill`, {
      method: 'POST',
    });
  },
  runPipeline(productId: string, templateId: string, locale: TargetLocale, adhocPrompt?: string) {
    return v2Request<{ run: PipelineRunV2; mock: boolean }>(`/products/${productId}/pipeline`, {
      method: 'POST',
      body: JSON.stringify({ templateId, locale, adhocPrompt }),
    });
  },
  listPipelineRuns(productId: string) {
    return v2Request<PipelineRunV2[]>(`/products/${productId}/pipeline-runs`);
  },
};

export const v2Api = resolveApiMode() === 'http' ? v2ApiHttp : v2ApiLocal;
