import { skipToken, useQuery } from '@tanstack/react-query';

import { fetchCloudBackup } from './cloudBackup';

export const cloudBackupQueryKey = (uid: string) => ['cloud-backup', uid];

/**
 * The signed-in account's cloud copy, or null when it has none. It is read live rather than cached
 * in a store: what matters is the copy as it is now, and only with a connection can it be used.
 */
export function useCloudBackup(uid: string | undefined) {
  return useQuery({
    queryKey: cloudBackupQueryKey(uid ?? ''),
    queryFn: uid ? () => fetchCloudBackup(uid) : skipToken,
  });
}
