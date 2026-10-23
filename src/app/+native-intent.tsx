type SystemPath = { path: string; initial: boolean };

/**
 * Firebase's Google sign-in comes back to the app by a link (`…://firebaseauth/link?…`) that
 * Firebase Auth handles on its own. The router must leave it alone rather than look for a screen
 * at that path; every other link opens as usual.
 */
export function redirectSystemPath({ path }: SystemPath): string | null {
  return path.includes('firebaseauth/link') ? null : path;
}
