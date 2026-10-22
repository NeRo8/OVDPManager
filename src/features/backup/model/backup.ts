import { z } from 'zod';

import {
  CURRENCIES,
  InvestmentPlanSchema,
  LEGACY_PLAN_ID,
  LEGACY_PLAN_NAME,
  type InvestmentPlan,
  type WalletPurchase,
  PurchaseInputSchema,
  restorePortfolio,
} from '@/entities/portfolio';
import { confirmDestructive, plural, round2, todayISO } from '@/shared/lib';

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
    restorePortfolio(restored.purchases, restored.plans);
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
  /**
   * Version 5: plans are names only and every purchase, past or planned, is in `holdings` with its
   * `planId`. Version 4 kept planned purchases inside plans; older ones had no `planId`.
   */
  version: 5;
  exportedAt: string;
  /** Kept for compatibility with existing exported JSON files. */
  holdings: WalletPurchase[];
  plans: InvestmentPlan[];
};

export type BackupData = { purchases: WalletPurchase[]; plans?: InvestmentPlan[] };

export function serializeBackup(purchases: WalletPurchase[], plans: InvestmentPlan[]): string {
  const backup: Backup = {
    format: FORMAT,
    version: 5,
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
  planId: z
    .string({ error: 'id плану має бути рядком' })
    .min(1, { error: 'id плану не може бути порожнім' })
    .default(LEGACY_PLAN_ID),
});

/** A planned purchase as backups up to version 4 kept it, apart from the wallet. */
const LegacyPlanItemSchema = z.object({
  id: z.string().min(1),
  isin: z.string().regex(/^[A-Z]{2}[A-Z0-9]{10}$/),
  currency: z.enum(CURRENCIES),
  date: z.iso.date(),
  quantity: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  pricePerBond: z.number().finite().positive(),
});

/** A plan; up to version 4 it also carried its planned purchases. */
const BackupPlanSchema = InvestmentPlanSchema.extend({ items: z.array(z.unknown()).optional() });

/** A backup, or a bare array of purchases. */
const BackupListSchema = z.union([
  z.array(z.unknown()).transform((holdings) => ({ holdings, plans: undefined, plan: undefined })),
  z.object({
    holdings: z.array(z.unknown()),
    plans: z.array(z.unknown()).optional(),
    /** Version 2 stored one flat list of planned purchases. */
    plan: z.array(z.unknown()).optional(),
  }),
]);

function issues(error: z.ZodError): string {
  return [...new Set(error.issues.map((issue) => issue.message))].join('; ');
}

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
  function claimId(id: string, label: string) {
    if (ids.has(id)) throw new Error(`${label}: id повторюється`);
    ids.add(id);
  }

  const purchases = list.data.holdings.map((item, index): WalletPurchase => {
    const purchase = BackupPurchaseSchema.safeParse(item);
    if (!purchase.success) throw new Error(`Покупка №${index + 1}: ${issues(purchase.error)}`);
    const { id, ...purchaseData } = purchase.data;
    const restoredId = id ?? `restored-${index}-${Date.now().toString(36)}`;
    claimId(restoredId, `Покупка №${index + 1}`);
    return { ...purchaseData, id: restoredId };
  });

  /** A planned purchase of an older backup becomes a purchase of its plan. */
  function plannedPurchase(raw: unknown, planId: string, label: string): WalletPurchase {
    const item = LegacyPlanItemSchema.safeParse(raw);
    if (!item.success) throw new Error(`${label}: ${issues(item.error)}`);
    const { id, isin, currency, date, quantity, pricePerBond } = item.data;
    const restoredId = `planned-${id}`;
    claimId(restoredId, label);
    return {
      id: restoredId,
      planId,
      isin,
      currency,
      purchaseDate: date,
      quantity,
      amount: round2(quantity * pricePerBond),
    };
  }

  const planIds = new Set<string>();
  let plans: InvestmentPlan[] | undefined;
  if (list.data.plans) {
    plans = list.data.plans.map((raw, index) => {
      const parsed = BackupPlanSchema.safeParse(raw);
      if (!parsed.success) throw new Error(`План №${index + 1}: ${issues(parsed.error)}`);
      const { id, name, items = [] } = parsed.data;
      if (planIds.has(id)) throw new Error(`План №${index + 1}: id повторюється`);
      planIds.add(id);
      items.forEach((item, itemIndex) =>
        purchases.push(
          plannedPurchase(item, id, `План «${name}», планова покупка №${itemIndex + 1}`),
        ),
      );
      return { id, name };
    });
  } else if (list.data.plan?.length) {
    list.data.plan.forEach((item, index) =>
      purchases.push(plannedPurchase(item, LEGACY_PLAN_ID, `Планова покупка №${index + 1}`)),
    );
    plans = [{ id: LEGACY_PLAN_ID, name: LEGACY_PLAN_NAME }];
  }
  return { purchases, plans };
}
