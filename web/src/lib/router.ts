/** GitHub Pages 项目站 base，如 /E-comassit-plan；本地开发为 '' */
export function getRouterBasename() {
  const base = import.meta.env.BASE_URL ?? '/';
  const trimmed = base.replace(/\/$/, '');
  return trimmed || undefined;
}
