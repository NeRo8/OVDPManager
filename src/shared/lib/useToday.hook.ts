import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { todayISO } from './date';

/** Keep calendar-based calculations current at midnight and after returning to the app. */
export function useToday(): string {
  const [today, setToday] = useState(todayISO);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      setToday(todayISO());
      const next = new Date();
      next.setHours(24, 0, 0, 0);
      timer = setTimeout(refresh, Math.max(1, next.getTime() - Date.now() + 50));
    };
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);
  return today;
}
