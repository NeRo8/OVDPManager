import { useSyncExternalStore } from 'react';

import {
  type GoogleAccount,
  getSignedInUser,
  subscribeToSignedInUser,
  toGoogleAccount,
} from '@/api/backup/googleAccount';

/** The Google account signed in for the cloud backup, or null. */
export function useGoogleAccount(): GoogleAccount | null {
  return toGoogleAccount(useSyncExternalStore(subscribeToSignedInUser, getSignedInUser));
}
