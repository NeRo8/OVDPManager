import { isMoreThanADayLater, toISODate } from '@/shared/lib/date';

import { useAppSettingsStore } from './store';
import type { ThemePreference } from './types';

export function setPreferredTheme(preference: ThemePreference): void {
  useAppSettingsStore.setState({ preference });
}

/** Record the opening and report whether more than 24 hours have passed since the last one. */
export function recordAppOpening(): boolean {
  const now = new Date();
  const { lastOpenedAt } = useAppSettingsStore.getState();
  const isReturningAfterDay = lastOpenedAt !== null && isMoreThanADayLater(now, lastOpenedAt);
  useAppSettingsStore.setState({ today: toISODate(now), lastOpenedAt: now.getTime() });
  return isReturningAfterDay;
}
