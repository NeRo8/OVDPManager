import { Share } from 'react-native';

// Native: the share sheet lets the user save the JSON to Files, Notes or a messenger.
export async function exportBackupFile(json: string, fileName: string): Promise<void> {
  await Share.share({ title: fileName, message: json });
}

/** Native restores by pasting the copied file contents instead. */
export const canPickFile = false;

export async function pickBackupFile(): Promise<string | null> {
  return null;
}
