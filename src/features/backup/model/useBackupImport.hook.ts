import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFormState } from 'react-hook-form';
import { z } from 'zod';

import { useInvestmentPlans, usePurchases } from '@/entities/portfolio';
import { showToast } from '@/shared/lib';
import { pickBackupFile } from '../api/backupFile';
import { errorMessage, parseBackup, replaceWithBackup } from './backup';

const PastedBackupSchema = z.object({
  json: z.string().trim().min(1, { error: 'Вставте вміст файлу копії' }),
});

type PastedBackup = z.infer<typeof PastedBackupSchema>;

/**
 * Restoring from a picked file or from pasted JSON. The outcome comes as a toast, except a problem
 * with pasted JSON, which is shown under the field it came from.
 */
export function useBackupImport() {
  const purchases = usePurchases();
  const plans = useInvestmentPlans();
  const form = useForm<PastedBackup>({
    resolver: zodResolver(PastedBackupSchema),
    mode: 'onChange',
    defaultValues: { json: '' },
  });

  // Read through the hook, not `form.formState`, which the React Compiler would cache.
  const { errors, isValid } = useFormState({ control: form.control });

  // Restored data replaces whatever was pasted, along with its error.
  function restore(text: string, source: string) {
    replaceWithBackup(parseBackup(text), purchases.length, plans.length, source, () =>
      form.reset(),
    );
  }

  async function restoreFromFile() {
    try {
      const text = await pickBackupFile();
      if (text) restore(text, 'з файлу');
    } catch (error) {
      showToast({ tone: 'error', title: 'Не вдалося відновити', message: errorMessage(error) });
    }
  }

  const restorePasted = form.handleSubmit(({ json }) => {
    try {
      restore(json, 'з копії');
    } catch (error) {
      form.setError('json', { message: errorMessage(error) });
    }
  });

  return {
    control: form.control,
    pastedError: errors.json?.message,
    canRestorePasted: isValid,
    restoreFromFile,
    restorePasted,
  };
}
