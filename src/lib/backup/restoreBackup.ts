import { planCount, operationCount } from '@/lib/portfolio/counts';
import { showToast } from '@/stores/appSettings';
import { getOperations } from '@/stores/operations';
import { getInvestmentPlans, restorePortfolio } from '@/stores/plans';
import { setThemePreference } from '@/theme/themePreference';
import { confirmDestructive } from '@/utils/confirm';

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
  const currentPurchases = getOperations().length;
  const restoredSummary = `${planCount(restored.plans.length)} і ${operationCount(restored.operations.length)} ${SOURCE_PHRASES[source]}`;
  const apply = () => {
    restorePortfolio(restored.operations, restored.plans);
    if (restored.theme) setThemePreference(restored.theme);
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
    `Зараз ${planCount(currentPlans)} і ${operationCount(currentPurchases)}. Їх буде замінено на ${restoredSummary}.`,
    'Замінити',
    apply,
  );
}
