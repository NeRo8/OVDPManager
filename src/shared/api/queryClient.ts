import { QueryCache, QueryClient } from '@tanstack/react-query';

import { showToast } from '@/shared/lib';

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: {
      /** Toast title for a failed refetch over data the screen already shows */
      errorTitle?: string;
    };
  }
}

/**
 * The app's one query client. A query that fails over data it already has tells the user in a
 * toast with a retry; without data the screen shows the error itself.
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const title = query.meta?.errorTitle;
      if (!title || query.state.data === undefined) return;
      showToast({
        tone: 'error',
        title,
        message: `${error.message}. Показано збережені дані.`,
        action: {
          label: 'Повторити',
          onPress: () => void queryClient.refetchQueries({ queryKey: query.queryKey }),
        },
      });
    },
  }),
  defaultOptions: {
    queries: { retry: 1 },
  },
});
