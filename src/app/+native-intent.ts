import type { NativeIntent } from 'expo-router';

/**
 * Google sign-in returns to the app through Firebase's `…://firebaseauth/link` link, which
 * Firebase Auth reads natively. The router has no such screen, so it stays where it is.
 */
export const redirectSystemPath: NativeIntent['redirectSystemPath'] = ({ path }) =>
  path.includes('firebaseauth/link') ? null : path;
