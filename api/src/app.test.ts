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
});
