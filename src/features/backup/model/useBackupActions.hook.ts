import { useState } from 'react';

import { useInvestmentPlans, usePurchases } from '@/entities/portfolio';
import { confirmDestructive, showToast } from '@/shared/lib';
import { exportBackupFile, readMockFile, writeMockFile } from '../api/backupFile';
import {
  backupFileName,
  errorStatus,
  parseBackup,
  planCount,
  purchaseCount,
  replaceWithBackup,
  serializeBackup,
} from './backup';

/** Backup actions that run in place: no screen of their own, outcomes come as alerts. */
export function useBackupActions() {
  const purchases = usePurchases();
  const plans = useInvestmentPlans();
  const [isBusy, setBusy] = useState(false);

  async function run(task: () => Promise<void>) {
    setBusy(true);
    try {
      await task();
    } catch (error) {
      showToast({ tone: 'error', title: 'Не вдалося', message: errorStatus(error).text });
    } finally {
      setBusy(false);
    }
  }

  /** The share sheet is the outcome: the user saves or sends the file from there. */
  const exportBackup = () =>
    run(() => exportBackupFile(serializeBackup(purchases, plans), backupFileName()));

  const writeMock = () =>
    run(async () => {
      await writeMockFile(serializeBackup(purchases, plans));
      showToast({
        tone: 'success',
        title: 'Мок збережено',
        message: `На пристрої: ${purchaseCount(purchases.length)} в гаманці, ${planCount(plans.length)}.`,
      });
    });

  async function saveMock() {
    let existing: { purchases: number; plans: number } | null = null;
    try {
      const text = await readMockFile();
      if (text) {
        const saved = parseBackup(text);
        existing = { purchases: saved.purchases.length, plans: saved.plans?.length ?? 0 };
      }
    } catch {
      // An unreadable mock is overwritten without asking.
    }
    if (existing === null) {
      await writeMock();
      return;
    }
    confirmDestructive(
      'Перезаписати мок?',
      `На пристрої вже є мок: ${purchaseCount(existing.purchases)} в гаманці, ${planCount(existing.plans)}. Його буде замінено поточними даними.`,
      'Перезаписати',
      () => void writeMock(),
    );
  }

  const loadMock = () =>
    run(async () => {
      const text = await readMockFile();
      if (!text) throw new Error('Мок ще не збережено на цьому пристрої.');
      replaceWithBackup(parseBackup(text), purchases.length, plans.length, 'з мока', (status) =>
        showToast({ tone: 'success', title: status.text }),
      );
    });

  return {
    numberOfPurchases: purchases.length,
    numberOfPlans: plans.length,
    isBusy,
    exportBackup,
    saveMock,
    loadMock,
  };
}
