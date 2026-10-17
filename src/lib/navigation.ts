import { router } from 'expo-router';

/** Back when there is history; on web a page can be opened directly, so fall back to home. */
export function goBackOrHome() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}
