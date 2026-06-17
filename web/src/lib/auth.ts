import { useSyncExternalStore, useCallback } from 'react';
import { api, resolveApiMode } from './api';
import { getStoredToken, setStoredToken } from './api/httpClient';

const LEGACY_KEY = 'psa_demo_auth';
const AUTH_EVENT = 'psa-auth-change';

function getSnapshot() {
  if (resolveApiMode() === 'http') return Boolean(getStoredToken());
  return localStorage.getItem(LEGACY_KEY) === '1' || Boolean(getStoredToken());
}

function subscribe(cb: () => void) {
  window.addEventListener(AUTH_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(AUTH_EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

function notify() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function useAuth() {
  const isLoggedIn = useSyncExternalStore(subscribe, getSnapshot, () => false);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const session = await api.login(username, password);
      setStoredToken(session.accessToken);
      localStorage.setItem(LEGACY_KEY, '1');
      notify();
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    localStorage.removeItem(LEGACY_KEY);
    notify();
  }, []);

  return { isLoggedIn, login, logout };
}
