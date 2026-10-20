import { useState } from 'react';

import { useHoldings } from '@/entities/portfolio';
import { exportBackupFile } from '../api/backupFile';
import { backupFileName, purchaseCount, serializeBackup } from './backup';

export function useBackupExport() {
  const holdings = useHoldings();
  const [status, setStatus] = useState<{ error: boolean; text: string } | null>(null);

  async function exportFile() {
    try {
      await exportBackupFile(serializeBackup(holdings), backupFileName());
      setStatus({ error: false, text: `Копію створено: ${purchaseCount(holdings.length)}.` });
    } catch (error) {
      setStatus({ error: true, text: (error as Error).message });
    }
  }

  return { holdingsCount: holdings.length, status, exportFile };
}
