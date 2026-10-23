import {
  OAuthProvider,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInWithPopup,
  signOut,
  type AuthProvider,
  type User,
} from '@react-native-firebase/auth';

/** The Google account the cloud backup belongs to, as Firebase knows it. */
export type GoogleAccount = { uid: string; email: string };

/** Closing the sign-in sheet is not a failure: the user changed their mind. */
const CANCELLED = 'auth/popup-closed-by-user';

/**
 * Google through Firebase's own web sign-in, which returns to the app by the `REVERSED_CLIENT_ID`
 * scheme of GoogleService-Info.plist. `new GoogleAuthProvider()` cannot start it on the native
 * SDKs, so the generic provider names Google by id. Google always asks which account to use.
 */
function googleProvider(): AuthProvider {
  const provider = new OAuthProvider('google.com').setCustomParameters({
    prompt: 'select_account',
  });
  // RNFB 26.4 types the class's `providerId` as private, so TypeScript does not see its own
  // provider as an `AuthProvider`; at runtime it is exactly what the sign-in calls take.
  return provider as unknown as AuthProvider;
}

function isCancelled(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === CANCELLED;
}

export function toGoogleAccount(user: User | null): GoogleAccount | null {
  return user?.email ? { uid: user.uid, email: user.email } : null;
}

/** The signed-in Firebase user, kept by the native SDK across launches. */
export function getSignedInUser(): User | null {
  return getAuth().currentUser;
}

export function subscribeToSignedInUser(listener: () => void): () => void {
  return onAuthStateChanged(getAuth(), listener);
}

/** Signs into Firebase with a Google account. Null when the user closes the sign-in sheet. */
export async function signInWithGoogle(): Promise<GoogleAccount | null> {
  try {
    const { user } = await signInWithPopup(getAuth(), googleProvider());
    return toGoogleAccount(user);
  } catch (error) {
    if (isCancelled(error)) return null;
    throw error;
  }
}

/** The signed-in account, or a fresh sign-in when there is none. */
export async function ensureGoogleAccount(): Promise<GoogleAccount | null> {
  return toGoogleAccount(getSignedInUser()) ?? signInWithGoogle();
}

export async function signOutOfGoogle(): Promise<void> {
  await signOut(getAuth());
}

/**
 * Has Google confirm the signed-in account again: Firebase deletes only a user who signed in
 * recently. False when the user closes the sheet.
 */
export async function reauthenticateWithGoogle(user: User): Promise<boolean> {
  try {
    await reauthenticateWithPopup(user, googleProvider());
    return true;
  } catch (error) {
    if (isCancelled(error)) return false;
    throw error;
  }
}

export async function deleteSignedInUser(user: User): Promise<void> {
  await deleteUser(user);
}
