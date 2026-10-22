import { useState } from 'react';

import { useInvestmentPlans, usePurchases } from '@/entities/portfolio';
import { pickBackupFile } from '../api/backupFile';
import { type BackupStatus, errorStatus, parseBackup, replaceWithBackup } from './backup';

export function useBackupImport() {
  const purchases = usePurchases();
  const plans = useInvestmentPlans();
  const [pasted, setPasted] = useState('');
  const [status, setStatus] = useState<BackupStatus | null>(null);

  function restore(text: string, source: string) {
    try {
      replaceWithBackup(parseBackup(text), purchases.length, plans.length, source, (replaced) => {
        setPasted('');
        setStatus(replaced);
      });
    } catch (error) {
      setStatus(errorStatus(error));
    }
  }

  async function restoreFromFile() {
    try {
      const text = await pickBackupFile();
      if (text) restore(text, 'з файлу');
    } catch (error) {
      setStatus(errorStatus(error));
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
