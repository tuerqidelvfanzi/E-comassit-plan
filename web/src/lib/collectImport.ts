import { api, resolveApiMode } from './api';
import { isNormalizedProduct } from './collectTypes';
import { addDemoInboxItem } from './inboxStore';

export async function importCollectFromEncoded(encoded: string): Promise<{
  ok: boolean;
  title?: string;
  error?: string;
}> {
  let payload: unknown;
  try {
    payload = JSON.parse(decodeURIComponent(encoded));
  } catch {
    return { ok: false, error: 'JSON 解析失败' };
  }

  if (!isNormalizedProduct(payload)) {
    return { ok: false, error: '不符合采集契约' };
  }

  if (resolveApiMode() === 'http') {
    try {
      const ext = await api.getExtensionToken();
      const { product } = await api.submitCollect(payload, ext.token ?? '');
      return { ok: true, title: product.title };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'API 导入失败' };
    }
  }

  try {
    const item = addDemoInboxItem(payload);
    return { ok: true, title: item.title };
  } catch {
    return { ok: false, error: '本地导入失败' };
  }
}
