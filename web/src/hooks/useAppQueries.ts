import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Product, ProductStatus } from '../lib/api/types';

export type ProductListFilters = {
  status?: ProductStatus;
  source?: string;
  keyword?: string;
  dateFrom?: string;
  dateTo?: string;
};

export const queryKeys = {
  metrics: ['metrics'] as const,
  products: (filters?: ProductListFilters) => ['products', filters] as const,
  product: (id: string) => ['product', id] as const,
  templates: ['templates'] as const,
  rules: ['rules'] as const,
  insight: ['insight'] as const,
  publish: ['publish'] as const,
  extToken: ['extToken'] as const,
};

export function useMetrics() {
  return useQuery({ queryKey: queryKeys.metrics, queryFn: () => api.getMetrics() });
}

export function useProducts(
  status?: ProductStatus | 'all',
  extra?: Omit<ProductListFilters, 'status'>,
) {
  const filters: ProductListFilters = {
    ...extra,
    status: status === 'all' ? undefined : status,
  };
  return useQuery({
    queryKey: queryKeys.products(filters),
    queryFn: () => api.getProducts(filters),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => api.getProduct(id),
    enabled: Boolean(id),
  });
}

export function useTemplates() {
  return useQuery({ queryKey: queryKeys.templates, queryFn: () => api.getTemplates() });
}

export function useRules() {
  return useQuery({ queryKey: queryKeys.rules, queryFn: () => api.getRules() });
}

export function useInsight() {
  return useQuery({ queryKey: queryKeys.insight, queryFn: () => api.getInsight() });
}

export function usePublishTasks() {
  return useQuery({ queryKey: queryKeys.publish, queryFn: () => api.getPublishTasks() });
}

export function useExtensionToken() {
  return useQuery({ queryKey: queryKeys.extToken, queryFn: () => api.getExtensionToken() });
}

export function useInvalidateProducts() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['products'] });
    qc.invalidateQueries({ queryKey: queryKeys.metrics });
  };
}

export function useRunPipeline() {
  const qc = useQueryClient();
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (vars: { productId: string; templateId?: string; adhocPrompt?: string }) =>
      api.runPipeline(vars.productId, {
        templateId: vars.templateId,
        adhocPrompt: vars.adhocPrompt,
      }),
    onSuccess: (data, vars) => {
      invalidate();
      qc.setQueryData(queryKeys.product(vars.productId), data.product);
    },
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (id: string) => api.deleteProduct(id),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; patch: Partial<Product> }) =>
      api.updateProduct(vars.id, vars.patch),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.product(data.id), data);
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: queryKeys.metrics });
    },
  });
}
