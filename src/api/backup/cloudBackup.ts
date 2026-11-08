import {
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  runTransaction,
} from '@react-native-firebase/firestore';

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
export async function saveCloudBackup(
  account: GoogleAccount,
  json: string,
  previous: CloudBackup | null,
): Promise<CloudBackup> {
  if (!account.email) throw new Error('У цьому акаунті немає адреси email.');
  // The serialized envelope is ASCII: its encrypted contents are base64.
  if (json.length >= 900_000) {
    throw new Error('Копія завелика для хмари. Збережіть її у файл.');
  }
  const cloudBackup: CloudBackup = {
    email: account.email,
    exportedAt: new Date().toISOString(),
    backup: json,
  };
  const reference = backupDoc(account.uid);
  await runTransaction(getFirestore(), async (transaction) => {
    const snapshot = await transaction.get(reference);
    const current = snapshot.exists() ? (snapshot.data() as CloudBackup) : null;
    if (current?.backup !== previous?.backup || current?.exportedAt !== previous?.exportedAt) {
      throw new Error('Копію в хмарі змінено на іншому пристрої. Спробуйте зберегти ще раз.');
    }
    transaction.set(reference, cloudBackup);
  });
  return cloudBackup;
}

export async function deleteCloudBackup(uid: string): Promise<void> {
  await deleteDoc(backupDoc(uid));
}
