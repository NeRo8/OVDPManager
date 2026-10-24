import { router } from 'expo-router';

/** Return to holdings if this screen has no navigation history. */
export function goBackOrHome() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/holdings');
  }
}
