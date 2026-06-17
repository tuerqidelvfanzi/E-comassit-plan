import { serve } from '@hono/node-server';
import { app } from './app.js';
import { getPort } from './config.js';
import { migrate } from './db/migrate.js';

migrate();

const port = getPort();
console.log(`API listening on http://127.0.0.1:${port}/api/v1/health`);

serve({ fetch: app.fetch, port });
