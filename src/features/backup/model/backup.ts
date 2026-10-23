import { type InvestmentPlan, type PlanPurchase, restorePortfolio } from '@/entities/portfolio';
import { confirmDestructive, plural, showToast, todayISO } from '@/shared/lib';
import { type BackupEncryption, decryptBackup, encryptBackup } from '../lib/backupCipher';

const FORMAT = 'ovdp-manager-backup';
const VERSION = 6;

export function purchaseCount(count: number): string {
  return `${count} ${plural(count, 'покупка', 'покупки', 'покупок')}`;
}

export function planCount(count: number): string {
  return `${count} ${plural(count, 'план', 'плани', 'планів')}`;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Replaces every plan and purchase with the backup's, asking first when that would overwrite
 * something, and says so in a toast. `source` completes the messages: "з файлу", "з копії".
 */
export function replaceWithBackup(
  restored: BackupData,
  currentCount: number,
  currentPlanCount: number,
  source: string,
  onReplaced: () => void,
) {
  const restoredSummary = `${planCount(restored.plans.length)} і ${purchaseCount(restored.purchases.length)}`;
  const apply = () => {
    restorePortfolio(restored.purchases, restored.plans);
    showToast({
      tone: 'success',
      title: 'Копію відновлено',
      message: `Відновлено ${restoredSummary} ${source}.`,
    });
    onReplaced();
  };
  if (currentCount === 0 && currentPlanCount === 0) {
    apply();
    return;
  }
  confirmDestructive(
    'Замінити дані з копії?',
    `Зараз ${planCount(currentPlanCount)} і ${purchaseCount(currentCount)}. Їх буде замінено на ${restoredSummary} ${source}.`,
    'Замінити',
    apply,
  );
}

/** The file: readable framing around the encrypted plans and purchases. */
export type Backup = {
  format: typeof FORMAT;
  version: typeof VERSION;
  exportedAt: string;
  encryption: BackupEncryption;
  /** BackupContents as JSON, AES-256-GCM encrypted, base64 */
  data: string;
};

/** What the encrypted data holds. */
type BackupContents = {
  /** Every purchase of every plan, each with its `planId`. */
  holdings: PlanPurchase[];
  plans: InvestmentPlan[];
};

export type BackupData = { purchases: PlanPurchase[]; plans: InvestmentPlan[] };

/** Binds the encrypted data to this format and version, so neither can be swapped. */
const CONTEXT = `${FORMAT}:${VERSION}`;

export async function serializeBackup(
  purchases: PlanPurchase[],
  plans: InvestmentPlan[],
  key: string,
): Promise<string> {
  const contents: BackupContents = { holdings: purchases, plans };
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
  if (backup.format !== FORMAT) throw new Error('Це не резервна копія OVDP Manager');
  if (backup.version !== VERSION) {
    throw new Error(
      'Ця версія копії не підтримується: створіть нову копію в актуальній версії застосунку',
    );
  }

  const { holdings, plans } = parseJson<BackupContents>(await decryptBackup(backup, key, CONTEXT));
  // The app opens only with a plan, so a backup without one would leave nothing to show.
  if (!plans.length) throw new Error('У копії немає жодного плану');

  const planIds = new Set(plans.map((plan) => plan.id));
  holdings.forEach((purchase, index) => {
    if (!planIds.has(purchase.planId)) {
      throw new Error(`Покупка №${index + 1}: її плану немає в копії`);
    }
  });
  return { purchases: holdings, plans };
}
