import { type Holding, replaceHoldings } from '@/entities/portfolio';
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
  restored: Holding[],
  currentCount: number,
  source: string,
  onReplaced: (status: BackupStatus) => void,
) {
  const apply = () => {
    replaceHoldings(restored);
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
  holdings: Holding[];
};

export function serializeBackup(holdings: Holding[]): string {
  const backup: Backup = {
    format: FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    holdings,
  };
  return JSON.stringify(backup, null, 2);
}

export function backupFileName(): string {
  return `ovdp-backup-${todayISO()}.json`;
}

/** Reads a backup file (or a bare array of purchases). Throws an Error with a user-facing message. */
export function parseBackup(text: string): Holding[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Це не схоже на файл резервної копії (некоректний JSON)');
  }

  const list = Array.isArray(data) ? data : (data as Partial<Backup> | null)?.holdings;
  if (!Array.isArray(list)) {
    throw new Error('У файлі немає списку покупок');
  }

  return list.map((item, index) => {
    const h = item as Partial<Holding>;
    const isin = typeof h.isin === 'string' ? h.isin.trim().toUpperCase() : '';
    const valid =
      /^[A-Z]{2}[A-Z0-9]{10}$/.test(isin) &&
      typeof h.purchaseDate === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(h.purchaseDate) &&
      typeof h.amount === 'number' &&
      h.amount > 0 &&
      Number.isInteger(h.quantity) &&
      (h.quantity ?? 0) > 0;
    if (!valid) {
      throw new Error(`Покупка №${index + 1} має некоректні дані`);
    }
    return {
      id: typeof h.id === 'string' && h.id ? h.id : `restored-${index}-${Date.now().toString(36)}`,
      isin,
      purchaseDate: h.purchaseDate!,
      amount: h.amount!,
      quantity: h.quantity!,
    };
  });
}
