import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { registerV2Routes } from '../v2/routes.js';

describe('v2 mock routes', () => {
  const app = new Hono();
  registerV2Routes(app);

  it('registers overview route path', () => {
    const paths = app.routes.map((r) => r.path);
    expect(paths).toContain('/v2/overview');
    expect(paths).toContain('/v2/competitor-jobs');
    expect(paths).toContain('/v2/title-optimization/jobs');
  });
});
