import { useState } from 'react';

import { useInvestmentPlans, usePurchases } from '@/entities/portfolio';
import { showToast } from '@/shared/lib';
import { exportBackupFile } from '../api/backupFile';
import { backupFileName, errorMessage, serializeBackup } from './backup';

/** Backup actions that run in place, without a screen of their own; failures come as toasts. */
export function useBackupActions() {
  const purchases = usePurchases();
  const plans = useInvestmentPlans();
  const [isBusy, setBusy] = useState(false);

  async function run(task: () => Promise<void>) {
    setBusy(true);
    try {
      await task();
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'Не вдалося створити копію',
        message: errorMessage(error),
      });
    } finally {
      setBusy(false);
    }
  }

  /** The share sheet is the outcome: the user saves or sends the file from there. */
  const exportBackup = () =>
    run(() => exportBackupFile(serializeBackup(purchases, plans), backupFileName()));

  return {
    numberOfPurchases: purchases.length,
    numberOfPlans: plans.length,
    isBusy,
    exportBackup,
  };
}
