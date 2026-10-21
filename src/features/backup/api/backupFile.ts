import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function exportBackupFile(json: string, fileName: string): Promise<void> {
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  await file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: fileName });
}

export async function pickBackupFile(): Promise<string | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (picked.canceled) return null;
  return new File(picked.assets[0].uri).text();
}

/** Development fixture kept in the app's documents, so it survives reinstalls of a dev build. */
const mockFile = () => new File(Paths.document, 'ovdp-dev-mock.json');

export async function readMockFile(): Promise<string | null> {
  const file = mockFile();
  return file.exists ? file.text() : null;
}

export async function writeMockFile(json: string): Promise<void> {
  const file = mockFile();
  file.create({ overwrite: true });
  await file.write(json);
}
