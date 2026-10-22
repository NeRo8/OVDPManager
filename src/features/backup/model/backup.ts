import { z } from 'zod';

import {
  InvestmentPlanSchema,
  PlanItemSchema,
  type InvestmentPlan,
  type PlannedPurchase,
  type Purchase,
  PurchaseInputSchema,
  legacyPlan,
  replaceInvestmentPlans,
  replacePurchases,
} from '@/entities/portfolio';
import { confirmDestructive, plural, todayISO } from '@/shared/lib';

const FORMAT = 'ovdp-manager-backup';

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
 * Replaces the wallet with restored purchases, asking first when that would overwrite some.
 * `source` completes the messages: "з файлу", "з мока".
 */
export function replaceWithBackup(
  restored: BackupData,
  currentCount: number,
  currentPlanCount: number,
  source: string,
  onReplaced: (status: BackupStatus) => void,
) {
  const apply = () => {
    replacePurchases(restored.purchases);
    if (restored.plans) replaceInvestmentPlans(restored.plans);
    onReplaced({
      error: false,
      text: `Відновлено ${purchaseCount(restored.purchases.length)} ${source}${restored.plans ? ` і ${planCount(restored.plans.length)}` : ''}.`,
    });
  };
  if (currentCount === 0 && (!restored.plans || currentPlanCount === 0)) {
    apply();
    return;
  }
  confirmDestructive(
    'Замінити дані з копії?',
    `Зараз у гаманці ${purchaseCount(currentCount)}. Їх буде замінено на ${purchaseCount(restored.purchases.length)} ${source}.${restored.plans ? ` ${planCount(currentPlanCount)} теж буде замінено.` : ''}`,
    'Замінити',
    apply,
  );
}

export type Backup = {
  format: typeof FORMAT;
  version: 3;
  exportedAt: string;
  /** Kept for compatibility with existing exported JSON files. */
  holdings: Purchase[];
  plans: InvestmentPlan[];
};

export type BackupData = { purchases: Purchase[]; plans?: InvestmentPlan[] };

export function serializeBackup(purchases: Purchase[], plans: InvestmentPlan[]): string {
  const backup: Backup = {
    format: FORMAT,
    version: 3,
    exportedAt: new Date().toISOString(),
    holdings: purchases,
    plans,
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
  z.array(z.unknown()).transform((holdings) => ({ holdings, plans: undefined, plan: undefined })),
  z.object({
    holdings: z.array(z.unknown()),
    plans: z.array(z.unknown()).optional(),
    /** Version 2 stored one flat list. */
    plan: z.array(z.unknown()).optional(),
  }),
]);

/** Reads a backup file (or a bare array of purchases). Throws an Error with a user-facing message. */
export function parseBackup(text: string): BackupData {
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
  const purchases = list.data.holdings.map((item, index) => {
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
  const legacyIds = new Set<string>();
  const legacyItems = (list.data.plans === undefined ? list.data.plan : undefined)?.map(
    (item, index): PlannedPurchase => {
      const parsed = PlanItemSchema.safeParse(item);
      if (!parsed.success) {
        throw new Error(
          `Планова покупка №${index + 1}: ${parsed.error.issues.map((issue) => issue.message).join('; ')}`,
        );
      }
      if (legacyIds.has(parsed.data.id))
        throw new Error(`Планова покупка №${index + 1}: id повторюється`);
      legacyIds.add(parsed.data.id);
      return parsed.data;
    },
  );
  const planIds = new Set<string>();
  const plans =
    list.data.plans?.map((item, index): InvestmentPlan => {
      const parsed = InvestmentPlanSchema.safeParse(item);
      if (!parsed.success) {
        throw new Error(
          `План №${index + 1}: ${parsed.error.issues.map((issue) => issue.message).join('; ')}`,
        );
      }
      if (planIds.has(parsed.data.id)) throw new Error(`План №${index + 1}: id повторюється`);
      planIds.add(parsed.data.id);
      return parsed.data;
    }) ?? (legacyItems ? legacyPlan(legacyItems) : undefined);
  return { purchases, plans };
}
