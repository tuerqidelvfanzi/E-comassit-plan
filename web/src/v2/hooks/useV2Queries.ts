import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { v2Api } from '../api';
import type { TargetLocale } from '../types';

export const v2Keys = {
  overview: ['v2', 'overview'] as const,
  catalog: ['v2', 'catalog'] as const,
  adapters: ['v2', 'adapters'] as const,
  team: ['v2', 'team'] as const,
  openApi: ['v2', 'openApi'] as const,
  insights: ['v2', 'insights'] as const,
  competitors: ['v2', 'competitors'] as const,
  linkCollect: ['v2', 'linkCollect'] as const,
  publishV2: ['v2', 'publish'] as const,
  pipelineRuns: (id: string) => ['v2', 'pipeline', id] as const,
};

export function useV2Overview() {
  return useQuery({ queryKey: v2Keys.overview, queryFn: () => v2Api.getOverview() });
}

export function useV2TemplateCatalog() {
  return useQuery({ queryKey: v2Keys.catalog, queryFn: () => v2Api.getTemplateCatalog() });
}

export function useV2PublishAdapters() {
  return useQuery({ queryKey: v2Keys.adapters, queryFn: () => v2Api.getPublishAdapters() });
}

export function useV2Team() {
  return useQuery({ queryKey: v2Keys.team, queryFn: () => v2Api.getTeamMembers() });
}

export function useV2OpenApi() {
  return useQuery({ queryKey: v2Keys.openApi, queryFn: () => v2Api.getOpenApiIntegrations() });
}

export function useV2InsightsDashboard() {
  return useQuery({ queryKey: v2Keys.insights, queryFn: () => v2Api.getInsightsDashboard() });
}

export function useV2Competitors() {
  return useQuery({ queryKey: v2Keys.competitors, queryFn: () => v2Api.listCompetitorJobs() });
}

export function useV2LinkCollect() {
  return useQuery({ queryKey: v2Keys.linkCollect, queryFn: () => v2Api.listLinkCollect() });
}

export function useV2PublishTasks() {
  return useQuery({ queryKey: v2Keys.publishV2, queryFn: () => v2Api.listPublishTasks() });
}

export function useV2PipelineRuns(productId: string) {
  return useQuery({
    queryKey: v2Keys.pipelineRuns(productId),
    queryFn: () => v2Api.listPipelineRuns(productId),
    enabled: Boolean(productId),
  });
}

export function useCreateCompetitorJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { keyword: string; sourcePlatform: string }) =>
      v2Api.createCompetitorJob(v.keyword, v.sourcePlatform),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: v2Keys.competitors });
      qc.invalidateQueries({ queryKey: v2Keys.insights });
    },
  });
}

export function useRunCompetitorJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => v2Api.runCompetitorJob(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: v2Keys.competitors });
      qc.invalidateQueries({ queryKey: v2Keys.insights });
    },
  });
}

export function useCreateLinkCollect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (url: string) => v2Api.createLinkCollect(url),
    onSuccess: () => qc.invalidateQueries({ queryKey: v2Keys.linkCollect }),
  });
}

export function useSimulatePublishFill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => v2Api.simulatePublishFill(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: v2Keys.publishV2 }),
  });
}

export function useV2RunPipeline(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { templateId: string; locale: TargetLocale; adhocPrompt?: string }) =>
      v2Api.runPipeline(productId, v.templateId, v.locale, v.adhocPrompt),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: v2Keys.pipelineRuns(productId) });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['product', productId] });
    },
  });
}
