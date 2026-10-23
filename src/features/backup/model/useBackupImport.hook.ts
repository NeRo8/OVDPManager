import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useFormState } from 'react-hook-form';
import { z } from 'zod';

import { useInvestmentPlans, usePurchases } from '@/entities/portfolio';
import { pickBackupFile } from '../api/backupFile';
import { type BackupStatus, errorStatus, parseBackup, replaceWithBackup } from './backup';

const PastedBackupSchema = z.object({
  json: z.string().trim().min(1, { error: 'Вставте вміст файлу копії' }),
});

type PastedBackup = z.infer<typeof PastedBackupSchema>;

/**
 * Restoring from a picked file or from pasted JSON. A file's outcome comes as a status above the
 * screen; a problem with pasted JSON is shown under the field it came from.
 */
export function useBackupImport() {
  const purchases = usePurchases();
  const plans = useInvestmentPlans();
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const form = useForm<PastedBackup>({
    resolver: zodResolver(PastedBackupSchema),
    mode: 'onChange',
    defaultValues: { json: '' },
  });

  // Read through the hook, not `form.formState`, which the React Compiler would cache.
  const { errors, isValid } = useFormState({ control: form.control });

  function restore(text: string, source: string, onReplaced?: () => void) {
    replaceWithBackup(parseBackup(text), purchases.length, plans.length, source, (replaced) => {
      onReplaced?.();
      setStatus(replaced);
    });
  }

  async function restoreFromFile() {
    try {
      const text = await pickBackupFile();
      if (text) restore(text, 'з файлу');
    } catch (error) {
      setStatus(errorStatus(error));
    }
  }

  const restorePasted = form.handleSubmit(({ json }) => {
    setStatus(null);
    try {
      restore(json, 'з копії', () => form.reset());
    } catch (error) {
      form.setError('json', { message: errorStatus(error).text });
    }
  });

  return {
    control: form.control,
    pastedError: errors.json?.message,
    canRestorePasted: isValid,
    status,
    restoreFromFile,
    restorePasted,
  };
}
