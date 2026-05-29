import { useSyncExternalStore } from 'react';

const KEY = 'psa_demo_auth';

function getSnapshot() {
  return localStorage.getItem(KEY) === '1';
}

function subscribe(cb: () => void) {
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
}

export function useAuth() {
  const isLoggedIn = useSyncExternalStore(subscribe, getSnapshot, () => false);

  return {
    isLoggedIn,
    login(username: string, password: string) {
      if (username === 'admin01' && password === 'abcd234') {
        localStorage.setItem(KEY, '1');
        window.dispatchEvent(new Event('storage'));
        return true;
      }
      return false;
    },
    logout() {
      localStorage.removeItem(KEY);
      window.dispatchEvent(new Event('storage'));
    },
  };
}
