import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, useFormState } from 'react-hook-form';
import { z } from 'zod';

import { exportBackupFile } from '@/api/backup/backupFile';
import { fetchCloudBackup, saveCloudBackup } from '@/api/backup/cloudBackup';
import { ensureGoogleAccount } from '@/api/backup/googleAccount';
import { backupFileName, serializeBackup } from '@/lib/backup/backup';
import { BackupKeySchema } from '@/lib/backup/backupKey.schema';
import { errorMessage } from '@/lib/backup/errorMessage';
import { getThemePreference, showToast } from '@/stores/appSettings';
import { getOperations } from '@/stores/operations';
import { getInvestmentPlans } from '@/stores/plans';
import { askDestructive } from '@/utils/confirm';
import { formatDateTime } from '@/utils/date';

import { cloudBackupQueryKey } from './useCloudBackup.hook';
import { useGoogleAccount } from './useGoogleAccount.hook';

// The key cannot be recovered, so it is typed twice: a typo would lock the backup for good.
const BackupExportSchema = z
  .object({ key: BackupKeySchema, confirmation: z.string() })
  .refine(({ key, confirmation }) => key === confirmation, {
    error: 'Ключі не збігаються',
    path: ['confirmation'],
  });

type BackupExportForm = z.infer<typeof BackupExportSchema>;

/** Every plan and purchase on the device, and the theme, as a backup holds them. */
const currentBackup = () => ({
  operations: getOperations(),
  plans: getInvestmentPlans(),
  theme: getThemePreference(),
});

/** Where the backup goes: the account's cloud copy or a file from the share sheet. */
type ExportTarget = 'cloud' | 'file';

/**
 * Making a backup: every plan and purchase, encrypted with the key the user gives it, saved as the
 * Google account's cloud copy or handed to the share sheet as a file. A failure comes as a toast.
 */
export function useBackupExport(onExported: () => void) {
  const account = useGoogleAccount();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<ExportTarget | null>(null);
  const form = useForm<BackupExportForm>({
    resolver: zodResolver(BackupExportSchema),
    mode: 'onChange',
    defaultValues: { key: '', confirmation: '' },
  });

  // Read through the hook, not `form.formState`, which the React Compiler would cache.
  const { errors, isValid } = useFormState({ control: form.control });

  async function run(next: ExportTarget, failureTitle: string, action: () => Promise<void>) {
    setTarget(next);
    try {
      await action();
    } catch (error) {
      showToast({ tone: 'error', title: failureTitle, message: errorMessage(error) });
    } finally {
      setTarget(null);
    }
  }

  const exportToFile = form.handleSubmit(({ key }) =>
    run('file', 'Не вдалося створити копію', async () => {
      const json = await serializeBackup(currentBackup(), key);
      // The share sheet is the outcome: the user saves or sends the file from there. Closed without
      // either, the screen stays, so the copy can be made again.
      const fileName = backupFileName();
      if (!(await exportBackupFile(json, fileName))) return;
      showToast({
        tone: 'success',
        title: 'Копію створено',
        message: `${fileName} збережено або надіслано`,
      });
      onExported();
    }),
  );

  const uploadToCloud = form.handleSubmit(({ key }) =>
    run('cloud', 'Не вдалося зберегти копію в хмарі', async () => {
      const signedIn = await ensureGoogleAccount();
      if (!signedIn) return;
      // The account keeps one copy, so an older one is replaced only on purpose.
      const previous = await fetchCloudBackup(signedIn.uid);
      const replace =
        !previous ||
        (await askDestructive(
          'Замінити копію в хмарі?',
          `У хмарі вже є копія від ${formatDateTime(previous.exportedAt)}. Нова копія замінить її.`,
          'Замінити',
        ));
      if (!replace) return;
      const json = await serializeBackup(currentBackup(), key);
      const saved = await saveCloudBackup(signedIn, json, previous);
      queryClient.setQueryData(cloudBackupQueryKey(signedIn.uid), saved);
      showToast({
        tone: 'success',
        title: 'Копію збережено в хмарі',
        message: signedIn.email ?? undefined,
      });
      onExported();
    }),
  );

  return {
    control: form.control,
    keyError: errors.key?.message,
    confirmationError: errors.confirmation?.message,
    accountEmail: account?.email,
    canExport: isValid && target === null,
    exportingTo: target,
    exportToFile,
    uploadToCloud,
  };
}
