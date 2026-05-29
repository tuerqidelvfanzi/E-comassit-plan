import { api } from './index';
import { getStoredToken } from './httpClient';

export function installExtensionBridge() {
  const w = window as Window & {
    __PSA_API?: {
      collectJob: (payload: unknown) => Promise<{ ok: boolean; productId?: string }>;
      getMode: () => string;
    };
  };
  w.__PSA_API = {
    getMode: () => (getStoredToken() ? 'api' : 'local'),
    async collectJob(payload) {
      try {
        const ext = await api.getExtensionToken();
        const token = ext.token ?? '';
        const { product } = await api.submitCollect(payload, token);
        return { ok: true, productId: product.id };
      } catch {
        return { ok: false };
      }
    },
  };
}
