import { type Href, router } from 'expo-router';

export function goBackOr(fallback: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

/** Return to holdings if this screen has no navigation history. */
export function goBackOrHome() {
  goBackOr('/holdings');
}
