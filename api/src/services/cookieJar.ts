import type Database from 'better-sqlite3';
import { getDb } from '../db/index.js';

export type StoredCookie = {
  name: string;
  value: string;
  domain: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  expirationDate?: number;
};

export function saveCookieJar(
  db: Database.Database,
  userId: string,
  domain: string,
  cookies: StoredCookie[],
) {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO user_cookie_jars (user_id, domain, cookies_json, consent_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, domain) DO UPDATE SET
       cookies_json = excluded.cookies_json,
       updated_at = excluded.updated_at,
       consent_at = excluded.consent_at`,
  ).run(userId, domain, JSON.stringify(cookies), now, now);
}

export function getCookieJar(db: Database.Database, userId: string, domain: string) {
  const row = db
    .prepare('SELECT cookies_json FROM user_cookie_jars WHERE user_id = ? AND domain = ?')
    .get(userId, domain) as { cookies_json: string } | undefined;
  if (!row) return [];
  return JSON.parse(row.cookies_json) as StoredCookie[];
}

export function listCookieDomains(userId: string) {
  const rows = getDb()
    .prepare('SELECT domain, updated_at, consent_at FROM user_cookie_jars WHERE user_id = ?')
    .all(userId) as Array<{ domain: string; updated_at: string; consent_at: string }>;
  return rows;
}

/** Playwright 可用的 cookie 格式 */
export function toPlaywrightCookies(cookies: StoredCookie[], defaultDomain: string) {
  return cookies.map((c) => ({
    name: c.name,
    value: c.value,
    domain: c.domain || defaultDomain,
    path: c.path ?? '/',
    secure: c.secure ?? true,
    httpOnly: c.httpOnly ?? false,
    sameSite: c.sameSite ?? ('Lax' as const),
    expires: c.expirationDate,
  }));
}
