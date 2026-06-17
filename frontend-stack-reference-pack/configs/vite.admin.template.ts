import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { existsSync, realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const adminRoot = resolve(repoRoot, 'apps/admin');
const nodeModulesPath = resolve(repoRoot, 'node_modules');
const fsAllow = [repoRoot, adminRoot];

if (existsSync(nodeModulesPath)) {
  fsAllow.push(realpathSync(nodeModulesPath));
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, '');
  const proxyTarget = env.VITE_PROXY_TARGET ?? 'http://127.0.0.1:8080';
  const configuredBase = process.env.VITE_BASE_PATH ?? env.VITE_BASE_PATH;
  const basePath = mode === 'development' ? '/' : normalizeBasePath(configuredBase ?? '/');

  return {
    root: adminRoot,
    envDir: repoRoot,
    base: basePath,
    cacheDir: resolve(repoRoot, 'node_modules/.vite-admin'),
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': resolve(adminRoot, 'src'),
        '@admin': resolve(adminRoot, 'src'),
      },
    },
    server: {
      port: 3005,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      fs: { allow: fsAllow },
      proxy: {
        '/api/v1': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 3005,
      host: '0.0.0.0',
    },
    build: {
      outDir: resolve(repoRoot, 'dist-admin'),
      emptyOutDir: true,
    },
  };
});

function normalizeBasePath(value: string) {
  if (!value || value === '/') return '/';
  return `/${value.replace(/^\/+|\/+$/g, '')}/`;
}
