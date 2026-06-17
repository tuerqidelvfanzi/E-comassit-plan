import path from 'node:path';

export function getDbPath() {
  return process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'app.db');
}

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  return secret ?? 'dev-only-change-me-in-production';
}

export function getPort() {
  return Number(process.env.PORT ?? 8080);
}

export const API_PREFIX = '/api/v1';
