import { deleteDoc, doc, getDoc, getFirestore, setDoc } from '@react-native-firebase/firestore';

import type { GoogleAccount } from './googleAccount';

/**
 * An account's one cloud copy: the backup file exactly as written, so it stays encrypted with the
 * user's key, with whose and when. Security rules let only its owner read or write it.
 */
export type CloudBackup = {
  email: string;
  /** ISO timestamp of the upload */
  exportedAt: string;
  /** The backup file's JSON */
  backup: string;
};

const backupDoc = (uid: string) => doc(getFirestore(), 'backups', uid);

export async function fetchCloudBackup(uid: string): Promise<CloudBackup | null> {
  const snapshot = await getDoc(backupDoc(uid));
  return snapshot.exists() ? (snapshot.data() as CloudBackup) : null;
}

/** Writes the backup over the account's previous one. */
export async function saveCloudBackup(account: GoogleAccount, json: string): Promise<CloudBackup> {
  const cloudBackup: CloudBackup = {
    email: account.email,
    exportedAt: new Date().toISOString(),
    backup: json,
  };
  await setDoc(backupDoc(account.uid), cloudBackup);
  return cloudBackup;
}

export async function deleteCloudBackup(uid: string): Promise<void> {
  await deleteDoc(backupDoc(uid));
}
