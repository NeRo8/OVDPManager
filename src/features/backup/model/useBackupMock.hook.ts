import { File, Paths } from 'expo-file-system';
import { useState } from 'react';

import { replaceHoldings, useHoldings } from '@/entities/portfolio';
import { parseBackup, purchaseCount, serializeBackup } from './backup';
import type { Holding } from '@/entities/portfolio';
import { confirmDestructive } from '@/shared/lib/confirm';

const mockFile = () => new File(Paths.document, 'ovdp-dev-mock.json');

export function useBackupMock() {
  const holdings = useHoldings();
  const [status, setStatus] = useState<{ error: boolean; text: string } | null>(null);
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
      setStatus({ error: true, text: (error as Error).message });
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
      const restored = parseBackup(await file.text());
      const apply = () => {
        replaceHoldings(restored);
        setStatus({ error: false, text: `Відновлено ${purchaseCount(restored.length)} з мока.` });
      };
      if (holdings.length === 0) apply();
      else {
        confirmDestructive(
          'Замінити дані гаманця?',
          `Зараз у гаманці ${purchaseCount(holdings.length)}. Їх буде замінено на ${purchaseCount(restored.length)} з мока.`,
          'Замінити',
          apply,
        );
      }
    } catch (error) {
      setStatus({ error: true, text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return { holdingsCount: holdings.length, status, isBusy, saveMock, loadMock };
}
