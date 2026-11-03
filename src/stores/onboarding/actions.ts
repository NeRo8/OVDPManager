import { useOnboardingStore } from './store';

/** Finishing and skipping are the same: the introduction is not shown again. */
export function completeOnboarding(): void {
  useOnboardingStore.setState({ isCompleted: true });
}
