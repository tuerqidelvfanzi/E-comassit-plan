import { resolveApiMode } from '../lib/api';

export function ApiModeBanner() {
  const mode = resolveApiMode();
  if (mode === 'http') {
    return (
      <p className="mb-4 rounded border border-[var(--color-primary)] bg-muted px-3 py-2 text-xs text-label">
        已连接 API 服务（{import.meta.env.DEV ? '开发代理 → :8080' : import.meta.env.VITE_API_URL}）
      </p>
    );
  }
  return (
    <p className="mb-4 rounded border border-[var(--color-border)] bg-muted px-3 py-2 text-xs text-muted">
      当前为<strong className="text-label">本地存储模式</strong>（GitHub Pages 静态托管）。
      配置 <code className="text-xs">VITE_API_URL</code> 并部署 <code className="text-xs">api/</code> 服务后可切换为生产 API。
    </p>
  );
}
