import { z } from 'zod';

import { CURRENCIES, type InvestmentPlan, type PlanPurchase } from '@/entities/portfolio';

import { todayISO } from '@/shared/lib';
import type { ThemePreference } from '@/shared/theme';

import { type BackupEncryption, decryptBackup, encryptBackup } from '../lib/backupCipher';

const FORMAT = 'ovdp-manager-backup';
const VERSION = 6;

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
  plans: Omit<InvestmentPlan, 'isActive'>[];
  activePlanId?: string;
  theme?: ThemePreference;
};

const currencySchema = z.enum(CURRENCIES);
const idSchema = z.string().trim().min(1);
const contentsSchema = z.object({
  activePlanId: idSchema.optional(),
  theme: z.enum(['system', 'light', 'dark']).optional(),
  plans: z.array(
    z.object({
      id: idSchema,
      name: z.string().trim().min(1),
    }),
  ),
  holdings: z.array(
    z.object({
      id: idSchema,
      planId: idSchema,
      isin: z.string().trim().min(1),
      purchaseDate: z.iso.date(),
      amount: z.number().positive().max(Number.MAX_SAFE_INTEGER),
      quantity: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      currency: currencySchema,
    }),
  ),
});

export type BackupData = {
  purchases: PlanPurchase[];
  plans: InvestmentPlan[];
  activePlanId?: string;
  theme?: ThemePreference;
};

/** Binds the encrypted data to this format and version, so neither can be swapped. */
const CONTEXT = `${FORMAT}:${VERSION}`;

export async function serializeBackup(
  purchases: PlanPurchase[],
  plans: InvestmentPlan[],
  key: string,
  activePlanId?: string,
  theme?: ThemePreference,
): Promise<string> {
  const backupPlans = plans.map(({ isActive: _isActive, ...plan }) => plan);
  const contents: BackupContents = { holdings: purchases, plans: backupPlans, activePlanId, theme };
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
  if (backup.format !== FORMAT) throw new Error('Це не резервна копія ОВДП Портфеля');
  if (backup.version !== VERSION) {
    throw new Error(
      'Ця версія копії не підтримується: створіть нову копію в актуальній версії застосунку',
    );
  }

  const contents: unknown = parseJson<unknown>(await decryptBackup(backup, key, CONTEXT));
  const validated = contentsSchema.safeParse(contents);
  if (!validated.success) throw new Error('Копія містить некоректні дані планів або купівель');
  const { holdings, plans, activePlanId, theme } = validated.data;
  // The app opens only with a plan, so a backup without one would leave nothing to show.
  if (!plans.length) throw new Error('У копії немає жодного плану');

  const planIds = new Set(plans.map((plan) => plan.id));
  if (activePlanId && !planIds.has(activePlanId)) {
    throw new Error('Активного плану немає в копії');
  }
  if (
    planIds.size !== plans.length ||
    new Set(holdings.map((purchase) => purchase.id)).size !== holdings.length
  ) {
    throw new Error('Копія містить повторні ідентифікатори');
  }
  holdings.forEach((purchase, index) => {
    if (!planIds.has(purchase.planId)) {
      throw new Error(`Купівля №${index + 1}: її плану немає в копії`);
    }
  });
  return {
    purchases: holdings,
    plans: plans.map((plan, index) => ({
      ...plan,
      isActive: activePlanId ? plan.id === activePlanId : index === 0,
    })),
    ...(activePlanId ? { activePlanId } : {}),
    ...(theme ? { theme } : {}),
  };
}
