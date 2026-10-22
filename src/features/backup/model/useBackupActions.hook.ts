import { useState } from 'react';

import { usePurchases } from '@/entities/portfolio';
import { confirmDestructive, showMessage } from '@/shared/lib';
import { exportBackupFile, readMockFile, writeMockFile } from '../api/backupFile';
import {
  backupFileName,
  errorStatus,
  parseBackup,
  purchaseCount,
  replaceWithBackup,
  serializeBackup,
} from './backup';

/** Backup actions that run in place: no screen of their own, outcomes come as alerts. */
export function useBackupActions() {
  const purchases = usePurchases();
  const [isBusy, setBusy] = useState(false);

  async function run(task: () => Promise<void>) {
    setBusy(true);
    try {
      await task();
    } catch (error) {
      showMessage('Не вдалося', errorStatus(error).text);
    } finally {
      setBusy(false);
    }
  }

  /** The share sheet is the outcome: the user saves or sends the file from there. */
  const exportBackup = () =>
    run(() => exportBackupFile(serializeBackup(purchases), backupFileName()));

  const writeMock = () =>
    run(async () => {
      await writeMockFile(serializeBackup(purchases));
      showMessage('Мок збережено', `На пристрої: ${purchaseCount(purchases.length)}.`);
    });

  async function saveMock() {
    let existing: number | null = null;
    try {
      const text = await readMockFile();
      if (text) existing = parseBackup(text).length;
    } catch {
      // An unreadable mock is overwritten without asking.
    }
    if (existing === null) {
      await writeMock();
      return;
    }
    confirmDestructive(
      'Перезаписати мок?',
      `На пристрої вже є мок: ${purchaseCount(existing)}. Його буде замінено поточними даними (${purchaseCount(purchases.length)}).`,
      'Перезаписати',
      () => void writeMock(),
    );
  }

  const loadMock = () =>
    run(async () => {
      const text = await readMockFile();
      if (!text) throw new Error('Мок ще не збережено на цьому пристрої.');
      replaceWithBackup(parseBackup(text), purchases.length, 'з мока', (status) =>
        showMessage(status.text),
      );
    });

  return { numberOfPurchases: purchases.length, isBusy, exportBackup, saveMock, loadMock };
}
