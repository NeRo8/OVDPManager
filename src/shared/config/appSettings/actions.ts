import { todayISO } from '@/shared/lib/date';

import { useAppSettingsStore } from './store';
import type { ThemePreference } from './types';

export function setPreferredTheme(preference: ThemePreference): void {
  useAppSettingsStore.setState({ preference });
}

/** Takes the device's date as today; called when the app opens or comes back to the front. */
export function refreshToday(): void {
  useAppSettingsStore.setState({ today: todayISO() });
}
