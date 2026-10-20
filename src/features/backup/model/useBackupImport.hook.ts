import { useState } from 'react';

import { replaceHoldings, useHoldings } from '@/entities/portfolio';
import { parseBackup, purchaseCount } from './backup';
import type { Holding } from '@/entities/portfolio';
import { pickBackupFile } from '../api/backupFile';
import { confirmDestructive } from '@/shared/lib/confirm';

export function useBackupImport() {
  const holdings = useHoldings();
  const [pasted, setPasted] = useState('');
  const [status, setStatus] = useState<{ error: boolean; text: string } | null>(null);

  function restore(text: string, source: string) {
    let restored: Holding[];
    try {
      restored = parseBackup(text);
    } catch (error) {
      setStatus({ error: true, text: (error as Error).message });
      return;
    }
    const apply = () => {
      replaceHoldings(restored);
      setPasted('');
      setStatus({ error: false, text: `Відновлено ${purchaseCount(restored.length)} ${source}.` });
    };
    if (holdings.length === 0) {
      apply();
      return;
    }
    confirmDestructive(
      'Замінити дані гаманця?',
      `Зараз у гаманці ${purchaseCount(holdings.length)}. Їх буде замінено на ${purchaseCount(restored.length)} ${source}.`,
      'Замінити',
      apply,
    );
  }

  async function restoreFromFile() {
    try {
      const text = await pickBackupFile();
      if (text) restore(text, 'з файлу');
    } catch (error) {
      setStatus({ error: true, text: (error as Error).message });
    }
  }

  return {
    pasted,
    setPasted,
    status,
    restoreFromFile,
    restorePasted: () => restore(pasted, 'з копії'),
  };
}
