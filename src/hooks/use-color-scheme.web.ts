import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const subscribe = () => () => {};

// The server can't know the visitor's theme and renders light. React uses the server snapshot
// (false) while hydrating, so the first client render matches the server HTML; right after
// hydration it re-renders with the client snapshot (true) and the real scheme.
export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const colorScheme = useRNColorScheme();

  return hasHydrated ? colorScheme : 'light';
}
