/** 插件演示包（构建时由 scripts/zip-extension 生成） */
export const EXTENSION_ZIP_NAME = 'ecommerce-assistant-extension-demo.zip';

export function getExtensionDownloadUrl() {
  const base = import.meta.env.BASE_URL;
  return `${base}downloads/${EXTENSION_ZIP_NAME}`;
}

export function downloadExtensionZip() {
  const a = document.createElement('a');
  a.href = getExtensionDownloadUrl();
  a.download = EXTENSION_ZIP_NAME;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
