import { createMiddleware } from 'hono/factory';
import { jwtVerify } from 'jose';
import { getJwtSecret } from '../config.js';
import { getDb } from '../db/index.js';
import { fail } from '../lib/response.js';

export type AuthUser = { id: string; username: string };

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

const secret = new TextEncoder().encode(getJwtSecret());

export async function signAccessToken(user: AuthUser) {
  const { SignJWT } = await import('jose');
  return new SignJWT({ sub: user.id, username: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret);
}

export async function signRefreshToken(user: AuthUser) {
  const { SignJWT } = await import('jose');
  return new SignJWT({ sub: user.id, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}

export const jwtAuth = createMiddleware(async (c, next) => {
  const header = c.req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return fail(c, 'UNAUTHORIZED', 401, 401);
  try {
    const { payload } = await jwtVerify(token, secret);
    const sub = payload.sub;
    if (!sub || typeof sub !== 'string') return fail(c, 'INVALID_TOKEN', 401, 401);
    const row = getDb().prepare('SELECT id, username FROM users WHERE id = ?').get(sub) as
      | AuthUser
      | undefined;
    if (!row) return fail(c, 'USER_NOT_FOUND', 401, 401);
    c.set('user', row);
    await next();
  } catch {
    return fail(c, 'INVALID_TOKEN', 401, 401);
  }
});

export const extensionAuth = createMiddleware(async (c, next) => {
  const ext = c.req.header('X-Extension-Token');
  if (!ext) return fail(c, 'EXTENSION_TOKEN_REQUIRED', 401, 401);
  const row = getDb()
    .prepare(
      `SELECT u.id, u.username FROM extension_tokens t
       JOIN users u ON u.id = t.user_id WHERE t.token = ?`,
    )
    .get(ext) as AuthUser | undefined;
  if (!row) return fail(c, 'INVALID_EXTENSION_TOKEN', 401, 401);
  c.set('user', row);
  await next();
});
