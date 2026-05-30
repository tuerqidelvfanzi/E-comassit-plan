import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const testDb = path.join(process.cwd(), 'data', 'test-app.db');
process.env.DATABASE_PATH = testDb;
process.env.JWT_SECRET = 'test-secret';

describe('API integration', () => {
  beforeAll(async () => {
    fs.rmSync(testDb, { force: true });
    const { migrate } = await import('./db/migrate.js');
    migrate();
  });

  afterAll(async () => {
    const { closeDb } = await import('./db/index.js');
    closeDb();
    fs.rmSync(testDb, { force: true });
  });

  it('seeds admin user', async () => {
    const { getDb } = await import('./db/index.js');
    const row = getDb().prepare('SELECT username FROM users WHERE username = ?').get('admin01') as
      | { username: string }
      | undefined;
    expect(row?.username).toBe('admin01');
  });

  it('login returns tokens', async () => {
    const { app } = await import('./app.js');
    const res = await app.fetch(
      new Request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin01', password: 'abcd234' }),
      }),
    );
    const json = (await res.json()) as { code: number; data: { accessToken: string } };
    expect(json.code).toBe(0);
    expect(json.data.accessToken).toBeTruthy();
  }, 15000);

  it('creates batch collect job', async () => {
    const { app } = await import('./app.js');
    const loginRes = await app.fetch(
      new Request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin01', password: 'abcd234' }),
      }),
    );
    const login = (await loginRes.json()) as { data: { accessToken: string } };
    const res = await app.fetch(
      new Request('http://localhost/api/v1/collect-jobs/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${login.data.accessToken}`,
        },
        body: JSON.stringify({
          listUrl: 'https://s.taobao.com/search?q=test',
          maxItems: 3,
          requireUserConfirm: true,
          startImmediately: false,
        }),
      }),
    );
    const json = (await res.json()) as { code: number; data: { id: string; status: string } };
    expect(json.code).toBe(0);
    expect(json.data.status).toBe('queued');
  });

  it('collect job requires extension token', async () => {
    const { getDb } = await import('./db/index.js');
    const { app } = await import('./app.js');
    const row = getDb()
      .prepare('SELECT token FROM extension_tokens LIMIT 1')
      .get() as { token: string };
    const res = await app.fetch(
      new Request('http://localhost/api/v1/collect-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Extension-Token': row.token,
        },
        body: JSON.stringify({
          payload: {
            title: '测试商品',
            sourceUrl: 'https://detail.1688.com/offer/test',
            source: '1688',
            price: { amount: 9.9, currency: 'CNY' },
            images: [],
            skus: [],
            attributes: {},
            capturedAt: new Date().toISOString(),
          },
        }),
      }),
    );
    const json = (await res.json()) as { code: number; data: { product: { title: string } } };
    expect(json.code).toBe(0);
    expect(json.data.product.title).toBe('测试商品');
  });

  it('prepares publish task with fill payload', async () => {
    const { app } = await import('./app.js');
    const loginRes = await app.fetch(
      new Request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin01', password: 'abcd234' }),
      }),
    );
    const login = (await loginRes.json()) as { data: { accessToken: string } };
    const createRes = await app.fetch(
      new Request('http://localhost/api/v1/publish-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${login.data.accessToken}`,
        },
        body: JSON.stringify({
          platform: 'Shopee',
          title: '测试发布',
          productId: 'p3',
        }),
      }),
    );
    const created = (await createRes.json()) as { data: { id: string } };
    const prepRes = await app.fetch(
      new Request(`http://localhost/api/v1/publish-tasks/${created.data.id}/prepare`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${login.data.accessToken}` },
      }),
    );
    const prep = (await prepRes.json()) as {
      code: number;
      data: { ok: boolean; fillPayload: { title: string; price: number } };
    };
    expect(prep.code).toBe(0);
    expect(prep.data.fillPayload.title).toBeTruthy();
    expect(prep.data.fillPayload.price).toBeGreaterThan(0);
  });

  it('creates image job for product', async () => {
    const { app } = await import('./app.js');
    const loginRes = await app.fetch(
      new Request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin01', password: 'abcd234' }),
      }),
    );
    const login = (await loginRes.json()) as { data: { accessToken: string } };
    const res = await app.fetch(
      new Request('http://localhost/api/v1/products/p1/image-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${login.data.accessToken}`,
        },
        body: JSON.stringify({ operations: ['dedupe_watermark'] }),
      }),
    );
    const json = (await res.json()) as { code: number; data: { status: string; resultUrls?: string[] } };
    expect(json.code).toBe(0);
    expect(json.data.status).toBe('completed');
    expect(json.data.resultUrls?.length).toBeGreaterThan(0);
  });
});
