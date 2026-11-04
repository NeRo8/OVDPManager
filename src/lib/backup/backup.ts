import type { InvestmentPlan } from '@/lib/portfolio/plan';
import type { PlanOperation } from '@/lib/portfolio/portfolio';
import type { ThemePreference } from '@/stores/appSettings';
import { todayISO } from '@/utils/date';

import { type BackupEncryption, decryptBackup, encryptBackup } from './backupCipher';
import { contentsSchema, legacyContentsSchema, validateContents } from './contents.schema';

const FORMAT = 'ovdp-manager-backup';
const VERSION = 9;

/** The file: readable framing around the encrypted plans and operations. */
export type Backup = {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  encryption: BackupEncryption;
  /** BackupContents as JSON, AES-256-GCM encrypted, base64 */
  data: string;
};

/** What the encrypted data holds. */
type BackupContents = {
  /** Every purchase of every plan, each with its `planId`. */
  operations: PlanOperation[];
  plans: Omit<InvestmentPlan, 'isActive'>[];
  activePlanId?: string;
  theme?: ThemePreference;
};

/** What a backup carries: every plan, the active one marked, their operations and the theme. */
export type BackupData = {
  operations: PlanOperation[];
  plans: InvestmentPlan[];
  theme?: ThemePreference;
};

/** Binds the encrypted data to this format and version, so neither can be swapped. */
const CONTEXT = `${FORMAT}:${VERSION}`;

export async function serializeBackup(
  { operations, plans, theme }: BackupData,
  key: string,
): Promise<string> {
  const contents: BackupContents = {
    operations,
    plans: plans.map(({ isActive: _isActive, ...plan }) => plan),
    activePlanId: plans.find((plan) => plan.isActive)?.id,
    theme,
  };
  const backup: Backup = {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    ...(await encryptBackup(JSON.stringify(contents), key, CONTEXT)),
  };
  return JSON.stringify(backup, null, 2);
}

export function backupFileName(): string {
  return `ovdp-backup-${todayISO()}.json`;
}

function parseJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Це не схоже на файл резервної копії (некоректний JSON)');
  }
}

/**
 * Reads and decrypts a backup file this app version wrote. Throws WrongBackupKeyError when the key
 * does not open it, and an Error with a user-facing message for anything else.
 */
export async function parseBackup(text: string, key: string): Promise<BackupData> {
  const backup = parseJson<Backup>(text);
  if (!backup || typeof backup !== 'object' || backup.format !== FORMAT)
    throw new Error('Це не резервна копія ОВДП Портфеля');
  if (
    backup.version !== VERSION &&
    backup.version !== 8 &&
    backup.version !== 7 &&
    backup.version !== 6
  ) {
    throw new Error(
      'Ця версія копії не підтримується: створіть нову копію в актуальній версії застосунку',
    );
  }

  const contents: unknown = parseJson<unknown>(
    await decryptBackup(backup, key, `${FORMAT}:${backup.version}`),
  );
  const validated =
    backup.version === 6
      ? legacyContentsSchema.safeParse(contents)
      : contentsSchema.safeParse(contents);
  if (!validated.success) throw new Error('Копія містить некоректні дані планів або операцій');
  const { plans, activePlanId, theme } = validated.data;
  const operations = validateContents(validated.data);
  return {
    operations,
    plans: plans.map((plan, index) => ({
      ...plan,
      isActive: activePlanId ? plan.id === activePlanId : index === 0,
    })),
    ...(theme ? { theme } : {}),
  };
}
