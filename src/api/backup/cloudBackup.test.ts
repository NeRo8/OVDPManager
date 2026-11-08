import { deleteDoc, doc, getDoc, runTransaction } from '@react-native-firebase/firestore';

import { deleteCloudBackup, fetchCloudBackup, saveCloudBackup } from './cloudBackup';

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(() => 'firestore'),
  doc: jest.fn(() => 'backup-document'),
  getDoc: jest.fn(),
  runTransaction: jest.fn(),
  deleteDoc: jest.fn(),
}));

describe('cloudBackup', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it('does not upload a backup without an email or one too large for the cloud', async () => {
    await expect(saveCloudBackup({ uid: 'u1', email: null }, '{}', null)).rejects.toThrow(
      'У цьому акаунті немає адреси email.',
    );
    await expect(
      saveCloudBackup({ uid: 'u1', email: 'a@example.com' }, 'x'.repeat(900_000), null),
    ).rejects.toThrow('Копія завелика для хмари. Збережіть її у файл.');
    expect(runTransaction).not.toHaveBeenCalled();
  });

  it('stores the encrypted file under the account and preserves its contents', async () => {
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-01-01T00:00:00.000Z');
    const set = jest.fn();
    jest.mocked(runTransaction).mockImplementation(async (_firestore, action) =>
      action({ get: async () => ({ exists: () => false }), set } as never),
    );
    const backup = await saveCloudBackup(
      { uid: 'u1', email: 'a@example.com' },
      '{"encrypted":true}',
      null,
    );
    expect(doc).toHaveBeenCalledWith('firestore', 'backups', 'u1');
    expect(set).toHaveBeenCalledWith('backup-document', backup);
    expect(backup).toEqual({
      email: 'a@example.com',
      exportedAt: '2026-01-01T00:00:00.000Z',
      backup: '{"encrypted":true}',
    });
  });

  it('does not replace a copy changed after the user saw it', async () => {
    const set = jest.fn();
    jest.mocked(runTransaction).mockImplementation(async (_firestore, action) =>
      action({
        get: async () => ({
          exists: () => true,
          data: () => ({ backup: 'new', exportedAt: 'new' }),
        }),
        set,
      } as never),
    );
    await expect(
      saveCloudBackup(
        { uid: 'u1', email: 'a@example.com' },
        'mine',
        { email: 'a@example.com', backup: 'old', exportedAt: 'old' },
      ),
    ).rejects.toThrow('змінено на іншому пристрої');
    expect(set).not.toHaveBeenCalled();
  });

  it('returns no backup for an absent document and propagates deletion errors', async () => {
    jest.mocked(getDoc).mockResolvedValue({ exists: () => false } as never);
    await expect(fetchCloudBackup('u1')).resolves.toBeNull();
    jest.mocked(deleteDoc).mockRejectedValue(new Error('offline'));
    await expect(deleteCloudBackup('u1')).rejects.toThrow('offline');
  });
});
