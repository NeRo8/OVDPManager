// expo-sqlite on web needs extra WASM/header setup, so web keeps data in localStorage.
// Access is guarded: server rendering has no window, and private mode can throw.

export const storage = {
  get(key: string): string | null {
    try {
      return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    } catch {
      // Storage unavailable — data lives for this session only.
    }
  },
};
