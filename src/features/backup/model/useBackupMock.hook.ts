import { File, Paths } from 'expo-file-system';
import { useState } from 'react';

import { type Holding, useHoldings } from '@/entities/portfolio';
import { confirmDestructive } from '@/shared/lib';
import {
  type BackupStatus,
  errorStatus,
  parseBackup,
  purchaseCount,
  replaceWithBackup,
  serializeBackup,
} from './backup';

const mockFile = () => new File(Paths.document, 'ovdp-dev-mock.json');

export function useBackupMock() {
  const holdings = useHoldings();
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [isBusy, setBusy] = useState(false);

  async function writeMock() {
    setBusy(true);
    try {
      const file = mockFile();
      file.create({ overwrite: true });
      await file.write(serializeBackup(holdings));
      setStatus({
        error: false,
        text: `Мок збережено на пристрої: ${purchaseCount(holdings.length)}.`,
      });
    } catch (error) {
      setStatus(errorStatus(error));
    } finally {
      setBusy(false);
    }
  }

  async function saveMock() {
    let existing: Holding[] | null = null;
    try {
      const file = mockFile();
      if (file.exists) existing = parseBackup(await file.text());
    } catch {
      // No readable mock yet.
    }
    if (!existing) {
      await writeMock();
      return;
    }
    confirmDestructive(
      'Перезаписати мок?',
      `У проєкті вже є мок: ${purchaseCount(existing.length)}. Його буде замінено поточними даними (${purchaseCount(holdings.length)}).`,
      'Перезаписати',
      () => void writeMock(),
    );
  }

  async function loadMock() {
    setBusy(true);
    try {
      const file = mockFile();
      if (!file.exists) throw new Error('Мок ще не збережено на цьому пристрої.');
      replaceWithBackup(parseBackup(await file.text()), holdings.length, 'з мока', setStatus);
    } catch (error) {
      setStatus(errorStatus(error));
    } finally {
      setBusy(false);
    }
  }

  return { holdingsCount: holdings.length, status, isBusy, saveMock, loadMock };
}
