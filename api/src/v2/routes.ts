import type { Hono } from 'hono';
import { z } from 'zod';
import { jwtAuth } from '../middleware/auth.js';
import { fail, ok } from '../lib/response.js';
import { getDb } from '../db/index.js';
import { v2Store } from './store.js';
import { titleOptimizationStore } from './titleOptimizationStore.js';

export function registerV2Routes(app: Hono) {
  app.get('/v2/overview', jwtAuth, (c) => {
    const userId = c.get('user').id;
    const total = (
      getDb().prepare('SELECT COUNT(*) as c FROM products WHERE user_id = ?').get(userId) as {
        c: number;
      }
    ).c;
    return ok(c, v2Store.overview(userId, total));
  });

  app.get('/v2/templates/catalog', jwtAuth, (c) => ok(c, v2Store.templateCatalog()));

  app.get('/v2/publish/adapters', jwtAuth, (c) => ok(c, v2Store.publishAdapters()));

  app.get('/v2/team/members', jwtAuth, (c) => ok(c, v2Store.team()));

  app.get('/v2/integrations/open-api', jwtAuth, (c) => ok(c, v2Store.openApiIntegrations()));

  app.get('/v2/insights/dashboard', jwtAuth, (c) => {
    const userId = c.get('user').id;
    return ok(c, v2Store.insightsDashboard(userId));
  });

  app.get('/v2/competitor-jobs', jwtAuth, (c) => {
    return ok(c, v2Store.listCompetitorJobs(c.get('user').id));
  });

  app.post('/v2/competitor-jobs', jwtAuth, async (c) => {
    const body = z
      .object({ keyword: z.string().min(1), sourcePlatform: z.string().default('淘宝') })
      .safeParse(await c.req.json());
    if (!body.success) return fail(c, 'INVALID_BODY');
    const job = v2Store.createCompetitorJob(
      c.get('user').id,
      body.data.keyword,
      body.data.sourcePlatform,
    );
    return ok(c, job, 201);
  });

  app.get('/v2/competitor-jobs/:id', jwtAuth, (c) => {
    const job = v2Store.getCompetitorJob(c.get('user').id, c.req.param('id'));
    if (!job) return fail(c, 'NOT_FOUND', 404, 404);
    return ok(c, job);
  });

  app.post('/v2/competitor-jobs/:id/run', jwtAuth, (c) => {
    const job = v2Store.runCompetitorJob(c.get('user').id, c.req.param('id'));
    if (!job) return fail(c, 'NOT_FOUND', 404, 404);
    return ok(c, job);
  });

  app.get('/v2/link-collect', jwtAuth, (c) => {
    return ok(c, v2Store.listLinkCollectJobs(c.get('user').id));
  });

  app.post('/v2/link-collect', jwtAuth, async (c) => {
    const body = z.object({ url: z.string().url() }).safeParse(await c.req.json());
    if (!body.success) return fail(c, 'INVALID_BODY');
    const job = v2Store.createLinkCollect(c.get('user').id, body.data.url);
    return ok(c, job, 201);
  });

  app.get('/v2/publish/tasks', jwtAuth, (c) => {
    return ok(c, v2Store.listPublishTasksV2(c.get('user').id));
  });

  app.post('/v2/publish/tasks', jwtAuth, async (c) => {
    const body = z
      .object({
        title: z.string(),
        platform: z.string(),
        locale: z.enum(['vi-VN', 'th-TH', 'fil-PH', 'id-ID']),
        productId: z.string().optional(),
        adapterId: z.string(),
      })
      .safeParse(await c.req.json());
    if (!body.success) return fail(c, 'INVALID_BODY');
    const task = v2Store.createPublishTaskV2(c.get('user').id, body.data);
    return ok(c, task, 201);
  });

  app.post('/v2/publish/tasks/:id/simulate-fill', jwtAuth, (c) => {
    const result = v2Store.simulatePublishFill(c.get('user').id, c.req.param('id'));
    if (!result) return fail(c, 'NOT_FOUND', 404, 404);
    return ok(c, result);
  });

  app.post('/v2/products/:id/pipeline', jwtAuth, async (c) => {
    const body = z
      .object({
        templateId: z.string(),
        locale: z.enum(['vi-VN', 'th-TH', 'fil-PH', 'id-ID']),
        adhocPrompt: z.string().optional(),
      })
      .safeParse(await c.req.json());
    if (!body.success) return fail(c, 'INVALID_BODY');
    const run = v2Store.runPipelineV2(
      c.get('user').id,
      c.req.param('id'),
      body.data.templateId,
      body.data.locale,
      body.data.adhocPrompt,
    );
    return ok(c, { run, mock: true }, 201);
  });

  app.get('/v2/products/:id/pipeline-runs', jwtAuth, (c) => {
    return ok(c, v2Store.listPipelineRuns(c.get('user').id, c.req.param('id')));
  });

  app.get('/v2/title-optimization/jobs', jwtAuth, (c) => {
    return ok(c, titleOptimizationStore.list(c.get('user').id));
  });

  app.post('/v2/title-optimization/jobs', jwtAuth, async (c) => {
    const body = z
      .object({
        categoryName: z.string().min(1),
        tmallProductId: z.string().min(1),
      })
      .safeParse(await c.req.json());
    if (!body.success) return fail(c, 'INVALID_BODY');
    const job = titleOptimizationStore.create(
      c.get('user').id,
      body.data.categoryName,
      body.data.tmallProductId,
    );
    return ok(c, job, 201);
  });

  app.get('/v2/title-optimization/jobs/:id', jwtAuth, (c) => {
    const job = titleOptimizationStore.get(c.get('user').id, c.req.param('id'));
    if (!job) return fail(c, 'NOT_FOUND', 404, 404);
    return ok(c, job);
  });

  app.post('/v2/title-optimization/jobs/:id/collect-search-terms', jwtAuth, (c) => {
    const job = titleOptimizationStore.collectSearchTerms(c.get('user').id, c.req.param('id'));
    if (!job) return fail(c, 'NOT_FOUND', 404, 404);
    return ok(c, job);
  });

  app.post('/v2/title-optimization/jobs/:id/generate-title', jwtAuth, (c) => {
    const job = titleOptimizationStore.generateTitle(c.get('user').id, c.req.param('id'));
    if (!job) return fail(c, 'NOT_FOUND', 404, 404);
    return ok(c, job);
  });

  app.post('/v2/title-optimization/jobs/:id/fetch-original', jwtAuth, (c) => {
    const job = titleOptimizationStore.fetchOriginal(c.get('user').id, c.req.param('id'));
    if (!job) return fail(c, 'NOT_FOUND', 404, 404);
    return ok(c, job);
  });

  app.post('/v2/title-optimization/jobs/:id/compare', jwtAuth, (c) => {
    const job = titleOptimizationStore.compare(c.get('user').id, c.req.param('id'));
    if (!job) return fail(c, 'NOT_FOUND', 404, 404);
    return ok(c, job);
  });

  app.post('/v2/title-optimization/jobs/:id/apply', jwtAuth, async (c) => {
    const body = z.object({ confirmed: z.boolean() }).safeParse(await c.req.json());
    if (!body.success) return fail(c, 'INVALID_BODY');
    const job = titleOptimizationStore.apply(
      c.get('user').id,
      c.req.param('id'),
      body.data.confirmed,
    );
    if (!job) return fail(c, 'NOT_FOUND', 404, 404);
    return ok(c, job);
  });
}
