import { z } from 'zod';

import {
  InvestmentPlanSchema,
  PurchaseInputSchema,
  type InvestmentPlan,
  type WalletPurchase,
  restorePortfolio,
} from '@/entities/portfolio';
import { confirmDestructive, plural, todayISO } from '@/shared/lib';

const FORMAT = 'ovdp-manager-backup';
const VERSION = 5;

export function purchaseCount(count: number): string {
  return `${count} ${plural(count, 'покупка', 'покупки', 'покупок')}`;
}

export function planCount(count: number): string {
  return `${count} ${plural(count, 'план', 'плани', 'планів')}`;
}

/** Outcome of a backup action, shown above the screen's content. */
export type BackupStatus = { error: boolean; text: string };

export function errorStatus(error: unknown): BackupStatus {
  return { error: true, text: error instanceof Error ? error.message : String(error) };
}

/**
 * Replaces every plan and purchase with the backup's, asking first when that would overwrite
 * something. `source` completes the messages: "з файлу", "з копії".
 */
export function replaceWithBackup(
  restored: BackupData,
  currentCount: number,
  currentPlanCount: number,
  source: string,
  onReplaced: (status: BackupStatus) => void,
) {
  const restoredSummary = `${planCount(restored.plans.length)} і ${purchaseCount(restored.purchases.length)}`;
  const apply = () => {
    restorePortfolio(restored.purchases, restored.plans);
    onReplaced({ error: false, text: `Відновлено ${restoredSummary} ${source}.` });
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

export type Backup = {
  format: typeof FORMAT;
  version: typeof VERSION;
  exportedAt: string;
  /** Every purchase of every plan, each with its `planId`. */
  holdings: WalletPurchase[];
  plans: InvestmentPlan[];
};

export type BackupData = { purchases: WalletPurchase[]; plans: InvestmentPlan[] };

export function serializeBackup(purchases: WalletPurchase[], plans: InvestmentPlan[]): string {
  const backup: Backup = {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    holdings: purchases,
    plans,
  };
  return JSON.stringify(backup, null, 2);
}

export function backupFileName(): string {
  return `ovdp-backup-${todayISO()}.json`;
}

/** Only backups this app version writes are read; the file comes from outside, so it is checked. */
const BackupSchema = z.object({
  format: z.literal(FORMAT, { error: 'Це не резервна копія OVDP Manager' }),
  version: z.literal(VERSION, { error: 'Ця версія копії не підтримується' }),
  holdings: z.array(z.unknown(), { error: 'У копії немає списку покупок' }),
  plans: z.array(z.unknown(), { error: 'У копії немає списку планів' }),
});

/** A purchase in a backup file. Messages finish the sentence "Покупка №N: …". */
const BackupPurchaseSchema = PurchaseInputSchema.extend({
  id: z.string({ error: 'немає id покупки' }).min(1, { error: 'id покупки не може бути порожнім' }),
  planId: z.string({ error: 'немає id плану' }).min(1, { error: 'id плану не може бути порожнім' }),
});

function issues(error: z.ZodError): string {
  return [...new Set(error.issues.map((issue) => issue.message))].join('; ');
}

/** Reads a backup file. Throws an Error with a user-facing message. */
export function parseBackup(text: string): BackupData {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Це не схоже на файл резервної копії (некоректний JSON)');
  }

  const backup = BackupSchema.safeParse(data);
  if (!backup.success) throw new Error(issues(backup.error));

  const planIds = new Set<string>();
  const plans = backup.data.plans.map((raw, index): InvestmentPlan => {
    const plan = InvestmentPlanSchema.safeParse(raw);
    if (!plan.success) throw new Error(`План №${index + 1}: ${issues(plan.error)}`);
    if (planIds.has(plan.data.id)) throw new Error(`План №${index + 1}: id повторюється`);
    planIds.add(plan.data.id);
    return plan.data;
  });
  // The app opens only with a plan, so a backup without one would leave nothing to show.
  if (!plans.length) throw new Error('У копії немає жодного плану');

  const purchaseIds = new Set<string>();
  const purchases = backup.data.holdings.map((raw, index): WalletPurchase => {
    const purchase = BackupPurchaseSchema.safeParse(raw);
    if (!purchase.success) throw new Error(`Покупка №${index + 1}: ${issues(purchase.error)}`);
    const { id, planId } = purchase.data;
    if (purchaseIds.has(id)) throw new Error(`Покупка №${index + 1}: id повторюється`);
    if (!planIds.has(planId)) throw new Error(`Покупка №${index + 1}: її плану немає в копії`);
    purchaseIds.add(id);
    return purchase.data;
  });
  return { purchases, plans };
}
