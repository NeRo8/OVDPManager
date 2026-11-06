import { deleteDoc, doc, getDoc, setDoc } from '@react-native-firebase/firestore';

import { deleteCloudBackup, fetchCloudBackup, saveCloudBackup } from './cloudBackup';

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(() => 'firestore'),
  doc: jest.fn(() => 'backup-document'),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
}));

describe('cloudBackup', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it('does not upload a backup without an email or one too large for the cloud', async () => {
    await expect(saveCloudBackup({ uid: 'u1', email: null }, '{}')).rejects.toThrow(
      'У цьому акаунті немає адреси email.',
    );
    await expect(
      saveCloudBackup({ uid: 'u1', email: 'a@example.com' }, 'x'.repeat(900_000)),
    ).rejects.toThrow('Копія завелика для хмари. Збережіть її у файл.');
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('stores the encrypted file under the account and preserves its contents', async () => {
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-01-01T00:00:00.000Z');
    jest.mocked(setDoc).mockResolvedValue(undefined);
    const backup = await saveCloudBackup(
      { uid: 'u1', email: 'a@example.com' },
      '{"encrypted":true}',
    );
    expect(doc).toHaveBeenCalledWith('firestore', 'backups', 'u1');
    expect(setDoc).toHaveBeenCalledWith('backup-document', backup);
    expect(backup).toEqual({
      email: 'a@example.com',
      exportedAt: '2026-01-01T00:00:00.000Z',
      backup: '{"encrypted":true}',
    });
  });

  it('returns no backup for an absent document and propagates deletion errors', async () => {
    jest.mocked(getDoc).mockResolvedValue({ exists: () => false } as never);
    await expect(fetchCloudBackup('u1')).resolves.toBeNull();
    jest.mocked(deleteDoc).mockRejectedValue(new Error('offline'));
    await expect(deleteCloudBackup('u1')).rejects.toThrow('offline');
  });
});
