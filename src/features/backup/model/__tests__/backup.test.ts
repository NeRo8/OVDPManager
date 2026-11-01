import type { InvestmentPlan, PlanPurchase } from '@/entities/portfolio';

import { WrongBackupKeyError, encryptBackup } from '../../lib/backupCipher';
import { type Backup, parseBackup, serializeBackup } from '../backup';

// The native module has no place under Jest; it follows Node's crypto API, Argon2id included, so
// Node's own crypto stands in for it and the file is made and read as on a phone.
jest.mock('react-native-quick-crypto', () => {
  const crypto = jest.requireActual('crypto');
  const { Buffer } = jest.requireActual('buffer');
  return {
    __esModule: true,
    default: { Buffer },
    argon2: crypto.argon2,
    createCipheriv: crypto.createCipheriv,
    createDecipheriv: crypto.createDecipheriv,
    randomBytes: crypto.randomBytes,
  };
});

const plans: InvestmentPlan[] = [
  { id: 'plan-1', name: 'Мій план', isActive: true },
  {
    id: 'plan-2',
    name: 'Другий план',
    isActive: false,
  },
];

const purchases: PlanPurchase[] = [
  {
    id: 'a',
    planId: 'plan-1',
    isin: 'UA4000227045',
    purchaseDate: '2025-03-10',
    amount: 10150.5,
    quantity: 10,
    currency: 'UAH',
  },
  {
    id: 'b',
    planId: 'plan-2',
    isin: 'UA4000234412',
    purchaseDate: '2027-01-01',
    amount: 2075,
    quantity: 2,
    currency: 'UAH',
  },
];

const KEY = 'довгий ключ копії';

/** The file with something in it changed, as JSON text. */
const changed = (text: string, change: (backup: Backup) => object) =>
  JSON.stringify(change(JSON.parse(text) as Backup));

describe('serializeBackup and parseBackup', () => {
  let file: string;
  beforeAll(async () => {
    file = await serializeBackup({ purchases, plans }, KEY);
  });

  it('gives back every plan and every purchase with the key', async () => {
    await expect(parseBackup(file, KEY)).resolves.toEqual({ purchases, plans });
  });

  it('preserves the active plan and the theme', async () => {
    const secondActive = plans.map((plan) => ({ ...plan, isActive: plan.id === 'plan-2' }));
    const saved = await serializeBackup({ purchases, plans: secondActive, theme: 'dark' }, KEY);
    await expect(parseBackup(saved, KEY)).resolves.toEqual({
      purchases,
      plans: secondActive,
      theme: 'dark',
    });
  });

  it('rejects an active plan absent from the backup', async () => {
    // The app never writes such a file; it is made here as one changed by hand would be.
    const contents = {
      holdings: [],
      plans: [{ id: 'plan-1', name: 'Мій план' }],
      activePlanId: 'missing',
    };
    const encrypted = await encryptBackup(JSON.stringify(contents), KEY, 'ovdp-manager-backup:6');
    const invalid = JSON.stringify({
      format: 'ovdp-manager-backup',
      version: 6,
      exportedAt: new Date().toISOString(),
      ...encrypted,
    });
    await expect(parseBackup(invalid, KEY)).rejects.toThrow('Активного плану немає в копії');
  });

  it('keeps only the framing readable and the plans and purchases encrypted', () => {
    const backup = JSON.parse(file) as Backup;
    expect(backup).toMatchObject({
      format: 'ovdp-manager-backup',
      version: 6,
      encryption: {
        kdf: 'argon2id',
        memory: 19 * 1024,
        passes: 2,
        parallelism: 1,
        cipher: 'aes-256-gcm',
      },
    });
    expect(file).not.toContain('Мій план');
    expect(file).not.toContain('UA4000227045');
  });

  it('makes a new file every time, so two copies with one key never look alike', async () => {
    const again = JSON.parse(await serializeBackup({ purchases, plans }, KEY)) as Backup;
    const first = JSON.parse(file) as Backup;
    expect(again.encryption.salt).not.toBe(first.encryption.salt);
    expect(again.encryption.iv).not.toBe(first.encryption.iv);
    expect(again.data).not.toBe(first.data);
  });

  it('refuses another key, and a file changed after it was made, alike', async () => {
    await expect(parseBackup(file, 'інший ключ')).rejects.toBeInstanceOf(WrongBackupKeyError);
    const tampered = changed(file, (backup) => ({
      ...backup,
      data: `${backup.data.slice(0, -4)}AAAA`,
    }));
    await expect(parseBackup(tampered, KEY)).rejects.toBeInstanceOf(WrongBackupKeyError);
  });

  it('rejects excessive or invalid key derivation parameters before deriving the key', async () => {
    for (const parameters of [{ memory: 1_000_000 }, { passes: 100 }, { parallelism: 0 }]) {
      const invalid = changed(file, (backup) => ({
        ...backup,
        encryption: { ...backup.encryption, ...parameters },
      }));
      await expect(parseBackup(invalid, KEY)).rejects.toThrow('Непідтримувані параметри');
    }
  });

  it('says what is wrong with a file that is no backup of this version', async () => {
    await expect(parseBackup('не JSON', KEY)).rejects.toThrow(
      'Це не схоже на файл резервної копії (некоректний JSON)',
    );
    await expect(
      parseBackup(
        changed(file, (backup) => ({ ...backup, format: 'інше' })),
        KEY,
      ),
    ).rejects.toThrow('Це не резервна копія ОВДП Портфеля');
    await expect(
      parseBackup(
        changed(file, (backup) => ({ ...backup, version: 5 })),
        KEY,
      ),
    ).rejects.toThrow('Ця версія копії не підтримується');
  });

  it('refuses a copy without a plan, and a purchase whose plan is not in it', async () => {
    await expect(parseBackup(await serializeBackup({ purchases: [], plans: [] }, KEY), KEY)).rejects.toThrow(
      'У копії немає жодного плану',
    );
    const orphan = await serializeBackup({ purchases, plans: [plans[0]] }, KEY);
    await expect(parseBackup(orphan, KEY)).rejects.toThrow('Купівля №2: її плану немає в копії');
  });

  it('rejects malformed purchase fields and duplicate ids before replacing any data', async () => {
    for (const change of [
      { quantity: 0 },
      { amount: 0 },
      { purchaseDate: 'bad' },
      { isin: '' },
      { currency: 'XXX' },
    ]) {
      const invalid = [{ ...purchases[0], ...change }] as PlanPurchase[];
      await expect(parseBackup(await serializeBackup({ purchases: invalid, plans }, KEY), KEY)).rejects.toThrow(
        'некоректні дані',
      );
    }
    await expect(
      parseBackup(await serializeBackup({ purchases: [purchases[0], purchases[0]], plans }, KEY), KEY),
    ).rejects.toThrow('повторні ідентифікатори');
  });
});
