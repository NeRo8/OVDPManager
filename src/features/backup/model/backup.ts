import { z } from 'zod';

import { type Purchase, PurchaseInputSchema, replacePurchases } from '@/entities/portfolio';
import { confirmDestructive, plural, todayISO } from '@/shared/lib';

const FORMAT = 'ovdp-manager-backup';

export function purchaseCount(count: number): string {
  return `${count} ${plural(count, 'покупка', 'покупки', 'покупок')}`;
}

/** Outcome of a backup action, shown above the screen's content. */
export type BackupStatus = { error: boolean; text: string };

export function errorStatus(error: unknown): BackupStatus {
  return { error: true, text: error instanceof Error ? error.message : String(error) };
}

/**
 * Replaces the wallet with restored purchases, asking first when that would overwrite some.
 * `source` completes the messages: "з файлу", "з мока".
 */
export function replaceWithBackup(
  restored: Purchase[],
  currentCount: number,
  source: string,
  onReplaced: (status: BackupStatus) => void,
) {
  const apply = () => {
    replacePurchases(restored);
    onReplaced({ error: false, text: `Відновлено ${purchaseCount(restored.length)} ${source}.` });
  };
  if (currentCount === 0) {
    apply();
    return;
  }
  confirmDestructive(
    'Замінити дані гаманця?',
    `Зараз у гаманці ${purchaseCount(currentCount)}. Їх буде замінено на ${purchaseCount(restored.length)} ${source}.`,
    'Замінити',
    apply,
  );
}

export type Backup = {
  format: typeof FORMAT;
  version: 1;
  exportedAt: string;
  /** Kept for compatibility with existing exported JSON files. */
  holdings: Purchase[];
};

export function serializeBackup(purchases: Purchase[]): string {
  const backup: Backup = {
    format: FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    holdings: purchases,
  };
  return JSON.stringify(backup, null, 2);
}

export function backupFileName(): string {
  return `ovdp-backup-${todayISO()}.json`;
}

/** A purchase in a backup file. The file comes from outside the app, so it is checked. */
const BackupPurchaseSchema = PurchaseInputSchema.extend({
  id: z.string().min(1, { error: 'id покупки не може бути порожнім' }).optional(),
});

/** A backup, or a bare array of purchases. */
const BackupListSchema = z.union([
  z.array(z.unknown()),
  z.object({ holdings: z.array(z.unknown()) }).transform((backup) => backup.holdings),
]);

/** Reads a backup file (or a bare array of purchases). Throws an Error with a user-facing message. */
export function parseBackup(text: string): Purchase[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Це не схоже на файл резервної копії (некоректний JSON)');
  }

  const list = BackupListSchema.safeParse(data);
  if (!list.success) {
    throw new Error('У файлі немає списку покупок');
  }

  const ids = new Set<string>();
  return list.data.map((item, index) => {
    const purchase = BackupPurchaseSchema.safeParse(item);
    if (!purchase.success) {
      const problems = [...new Set(purchase.error.issues.map((issue) => issue.message))];
      throw new Error(`Покупка №${index + 1}: ${problems.join('; ')}`);
    }
    const { id, ...purchaseData } = purchase.data;
    const restoredId = id ?? `restored-${index}-${Date.now().toString(36)}`;
    if (ids.has(restoredId)) {
      throw new Error(`Покупка №${index + 1}: id покупки повторюється`);
    }
    ids.add(restoredId);
    return { ...purchaseData, id: restoredId };
  });
}
