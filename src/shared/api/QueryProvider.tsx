import { type ReactNode, useEffect } from 'react';
import { AppState } from 'react-native';

import { QueryClientProvider, focusManager } from '@tanstack/react-query';

import { recordAppOpening } from '@/shared/config/appSettings';

import { queryClient } from './queryClient';

type Props = {
  children: ReactNode;
};

/** Gives the app the query client; stale queries refetch when the app comes back to the front. */
export function QueryProvider({ children }: Props) {
  useEffect(() => {
    const openApp = () => {
      if (recordAppOpening()) {
        void queryClient.invalidateQueries({ queryKey: ['nbu'] }, { cancelRefetch: false });
      }
    };
    openApp();
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') openApp();
      focusManager.setFocused(status === 'active');
    });
    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
