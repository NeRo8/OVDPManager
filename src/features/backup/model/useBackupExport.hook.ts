import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFormState } from 'react-hook-form';
import { z } from 'zod';

import { getInvestmentPlans, getPurchases } from '@/entities/portfolio';
import { showToast } from '@/shared/lib';
import { exportBackupFile } from '../api/backupFile';
import { backupFileName, serializeBackup } from './backup';
import { errorMessage } from './errorMessage';
import { BackupKeySchema } from './backupKey.schema';

// The key cannot be recovered, so it is typed twice: a typo would lock the backup for good.
const BackupExportSchema = z
  .object({ key: BackupKeySchema, confirmation: z.string() })
  .refine(({ key, confirmation }) => key === confirmation, {
    error: 'Ключі не збігаються',
    path: ['confirmation'],
  });

type BackupExportForm = z.infer<typeof BackupExportSchema>;

/**
 * Making a backup: every plan and purchase, encrypted with the key the user gives it, handed to
 * the share sheet. A failure comes as a toast.
 */
export function useBackupExport(onExported: () => void) {
  const form = useForm<BackupExportForm>({
    resolver: zodResolver(BackupExportSchema),
    mode: 'onChange',
    defaultValues: { key: '', confirmation: '' },
  });

  // Read through the hook, not `form.formState`, which the React Compiler would cache.
  const { errors, isValid, isSubmitting } = useFormState({ control: form.control });

  const exportBackup = form.handleSubmit(async ({ key }) => {
    try {
      const json = await serializeBackup(getPurchases(), getInvestmentPlans(), key);
      // The share sheet is the outcome: the user saves or sends the file from there.
      await exportBackupFile(json, backupFileName());
      onExported();
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'Не вдалося створити копію',
        message: errorMessage(error),
      });
    }
  });

  return {
    control: form.control,
    keyError: errors.key?.message,
    confirmationError: errors.confirmation?.message,
    canExport: isValid && !isSubmitting,
    isExporting: isSubmitting,
    exportBackup,
  };
}
