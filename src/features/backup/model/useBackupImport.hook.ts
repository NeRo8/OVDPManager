import { useState } from 'react';

import { useHoldings } from '@/entities/portfolio';
import { pickBackupFile } from '../api/backupFile';
import { type BackupStatus, errorStatus, parseBackup, replaceWithBackup } from './backup';

export function useBackupImport() {
  const holdings = useHoldings();
  const [pasted, setPasted] = useState('');
  const [status, setStatus] = useState<BackupStatus | null>(null);

  function restore(text: string, source: string) {
    try {
      replaceWithBackup(parseBackup(text), holdings.length, source, (replaced) => {
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
