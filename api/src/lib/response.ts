import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export function ok<T>(c: Context, data: T, status: ContentfulStatusCode = 200) {
  return c.json({ code: 0, message: 'ok', data }, status);
}

export function fail(c: Context, message: string, code = 1, status: ContentfulStatusCode = 400) {
  return c.json({ code, message, data: null }, status);
}

export function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
