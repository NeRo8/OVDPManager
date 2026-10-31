import { Platform, Share } from 'react-native';

import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Writes the backup to a file and hands it to the share sheet. True once the user saved or sent it;
 * false when the sheet was closed without doing either. iOS tells the two apart through the share
 * sheet's own result; Android's sheet does not report it, so there it always counts as done.
 */
export async function exportBackupFile(json: string, fileName: string): Promise<boolean> {
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  await file.write(json);
  if (Platform.OS === 'ios') {
    const { action } = await Share.share({ url: file.uri });
    return action === Share.sharedAction;
  }
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: fileName });
  return true;
}

export async function pickBackupFile(): Promise<string | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    // Apps on Android often save a received .json as plain text or bare bytes; parseBackup checks
    // the contents anyway, so those types stay pickable too.
    type: ['application/json', 'text/plain', 'application/octet-stream'],
    copyToCacheDirectory: true,
  });
  if (picked.canceled) return null;
  return new File(picked.assets[0].uri).text();
}
