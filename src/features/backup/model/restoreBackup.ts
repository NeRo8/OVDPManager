import {
  getInvestmentPlans,
  getPurchases,
  planCount,
  purchaseCount,
  restorePortfolio,
} from '@/entities/portfolio';
import { confirmDestructive, showToast } from '@/shared/lib';
import type { BackupData } from './backup';

/** Where the backup came from: the cloud copy, a picked file or pasted JSON. */
export type BackupSource = 'cloud' | 'file' | 'pasted';

const SOURCE_PHRASES = {
  cloud: 'з хмари',
  file: 'з файлу',
  pasted: 'з копії',
} as const satisfies Record<BackupSource, string>;

/**
 * Replaces every plan and purchase with the backup's, asking first when that would overwrite
 * something, and says so in a toast.
 */
export function restoreBackup(
  restored: BackupData,
  source: BackupSource,
  onRestored: () => void,
): void {
  const currentPlans = getInvestmentPlans().length;
  const currentPurchases = getPurchases().length;
  const restoredSummary = `${planCount(restored.plans.length)} і ${purchaseCount(restored.purchases.length)} ${SOURCE_PHRASES[source]}`;
  const apply = () => {
    restorePortfolio(restored.purchases, restored.plans);
    showToast({
      tone: 'success',
      title: 'Копію відновлено',
      message: `Відновлено ${restoredSummary}.`,
    });
    onRestored();
  };
  if (currentPlans === 0 && currentPurchases === 0) {
    apply();
    return;
  }
  confirmDestructive(
    'Замінити дані з копії?',
    `Зараз ${planCount(currentPlans)} і ${purchaseCount(currentPurchases)}. Їх буде замінено на ${restoredSummary}.`,
    'Замінити',
    apply,
  );
}
