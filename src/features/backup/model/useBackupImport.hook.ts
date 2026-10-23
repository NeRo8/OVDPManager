import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useFormState, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { useInvestmentPlans, usePurchases } from '@/entities/portfolio';
import { showToast } from '@/shared/lib';
import { pickBackupFile } from '../api/backupFile';
import { BackupKeySchema, WrongBackupKeyError } from '../lib/backupCipher';
import { errorMessage, parseBackup, replaceWithBackup } from './backup';

const BackupImportSchema = z.object({ key: BackupKeySchema, json: z.string() });

type BackupImportForm = z.infer<typeof BackupImportSchema>;

/**
 * Restoring from a picked file or from pasted JSON, both opened with the backup's key. The outcome
 * comes as a toast; a key that does not fit is shown under the key, a problem with pasted JSON
 * under the JSON.
 */
export function useBackupImport() {
  const purchases = usePurchases();
  const plans = useInvestmentPlans();
  const [isBusy, setBusy] = useState(false);
  const form = useForm<BackupImportForm>({
    resolver: zodResolver(BackupImportSchema),
    mode: 'onChange',
    defaultValues: { key: '', json: '' },
  });

  // Read through hooks, not `form.formState`, which the React Compiler would cache.
  const { errors } = useFormState({ control: form.control });
  const [key, json] = useWatch({ control: form.control, name: ['key', 'json'] });
  const hasKey = BackupKeySchema.safeParse(key).success;

  async function restore(text: string, source: string, showError: (message: string) => void) {
    setBusy(true);
    try {
      const restored = await parseBackup(text, key);
      // Restored data replaces whatever was typed, along with its errors.
      replaceWithBackup(restored, purchases.length, plans.length, source, () => form.reset());
    } catch (error) {
      if (error instanceof WrongBackupKeyError) form.setError('key', { message: error.message });
      else showError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function restoreFromFile() {
    let text: string | null;
    try {
      text = await pickBackupFile();
    } catch (error) {
      showToast({ tone: 'error', title: 'Не вдалося відкрити файл', message: errorMessage(error) });
      return;
    }
    if (text) {
      await restore(text, 'з файлу', (message) =>
        showToast({ tone: 'error', title: 'Не вдалося відновити', message }),
      );
    }
  }

  const restorePasted = form.handleSubmit(({ json: pasted }) =>
    restore(pasted.trim(), 'з копії', (message) => form.setError('json', { message })),
  );

  return {
    control: form.control,
    keyError: errors.key?.message,
    pastedError: errors.json?.message,
    canRestoreFile: hasKey && !isBusy,
    canRestorePasted: hasKey && json.trim().length > 0 && !isBusy,
    isBusy,
    restoreFromFile,
    restorePasted,
  };
}
