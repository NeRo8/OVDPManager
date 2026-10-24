import { useOnboardingStore } from './store';

export function useIsOnboardingCompleted(): boolean {
  return useOnboardingStore((state) => state.isCompleted);
}
