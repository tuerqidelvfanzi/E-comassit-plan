import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_PROXY_TARGET ?? 'http://127.0.0.1:8080';
  const configuredBase = env.VITE_BASE_PATH ?? '/';
  const base = mode === 'development' ? '/' : normalizeBasePath(configuredBase);

  return {
    base,
    plugins: [react(), tailwindcss()],
    server: {
      port: 3004,
      host: '0.0.0.0',
      proxy: {
        '/api/v1': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});

function normalizeBasePath(value: string) {
  if (!value || value === '/') return '/';
  return `/${value.replace(/^\/+|\/+$/g, '')}/`;
}
