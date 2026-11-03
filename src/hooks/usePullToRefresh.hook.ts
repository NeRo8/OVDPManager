import { useState } from 'react';

/**
 * Pull-to-refresh state for a `RefreshControl`. The spinner shows only for a refresh the user
 * pulled for: background loads must not make it appear when a screen opens.
 */
export function usePullToRefresh(refresh: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }

  return { refreshing, onRefresh: () => void onRefresh() };
}
