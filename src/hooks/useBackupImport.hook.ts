import { useRef, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFormState, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { pickBackupFile } from '@/api/backup/backupFile';
import { fetchCloudBackup } from '@/api/backup/cloudBackup';
import { ensureGoogleAccount } from '@/api/backup/googleAccount';
import { parseBackup } from '@/lib/backup/backup';
import { WrongBackupKeyError } from '@/lib/backup/backupCipher';
import { BackupKeySchema } from '@/lib/backup/backupKey.schema';
import { errorMessage } from '@/lib/backup/errorMessage';
import { type BackupSource, restoreBackup } from '@/lib/backup/restoreBackup';
import { showToast } from '@/stores/toast';

import { useGoogleAccount } from './useGoogleAccount.hook';

const BackupImportSchema = z.object({ key: BackupKeySchema, json: z.string() });

type BackupImportForm = z.infer<typeof BackupImportSchema>;

type Options = {
  /** Called once the backup's plans have replaced the current ones, to leave the screen */
  onRestored: () => void;
};

/**
 * Restoring from the Google account's cloud copy, a picked file or pasted JSON, all opened with
 * the backup's key. The outcome comes as a toast; a key that does not fit is shown under the key,
 * a problem with pasted JSON under the JSON.
 */
export function useBackupImport({ onRestored }: Options) {
  const account = useGoogleAccount();
  const [busySource, setBusySource] = useState<BackupSource | null>(null);
  const busyRef = useRef(false);
  const form = useForm<BackupImportForm>({
    resolver: zodResolver(BackupImportSchema),
    mode: 'onChange',
    defaultValues: { key: '', json: '' },
  });

  // Read through hooks, not `form.formState`, which the React Compiler would cache.
  const { errors } = useFormState({ control: form.control });
  const [key, json] = useWatch({ control: form.control, name: ['key', 'json'] });
  const hasKey = BackupKeySchema.safeParse(key).success;

  async function restore(text: string, source: BackupSource, showError: (message: string) => void) {
    try {
      const restored = await parseBackup(text, key);
      // Restored data replaces whatever was typed, along with its errors.
      restoreBackup(restored, source, () => {
        form.reset();
        onRestored();
      });
    } catch (error) {
      if (error instanceof WrongBackupKeyError) form.setError('key', { message: error.message });
      else showError(errorMessage(error));
    }
  }

  async function run(source: BackupSource, action: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusySource(source);
    try {
      await action();
    } finally {
      busyRef.current = false;
      setBusySource(null);
    }
  }

  const restoreFromFile = () =>
    run('file', async () => {
      let text: string | null;
      try {
        text = await pickBackupFile();
      } catch (error) {
        showToast({
          tone: 'error',
          title: 'Не вдалося відкрити файл',
          message: errorMessage(error),
        });
        return;
      }
      if (text) {
        await restore(text, 'file', (message) =>
          showToast({ tone: 'error', title: 'Не вдалося відновити', message }),
        );
      }
    });

  const restoreFromCloud = () =>
    run('cloud', async () => {
      let text: string;
      try {
        const signedIn = await ensureGoogleAccount();
        const cloudBackup = signedIn && (await fetchCloudBackup(signedIn.uid));
        if (!cloudBackup) {
          if (signedIn) {
            showToast({
              tone: 'info',
              title: 'У хмарі немає копії',
              message: signedIn.email ?? undefined,
            });
          }
          return;
        }
        text = cloudBackup.backup;
      } catch (error) {
        showToast({
          tone: 'error',
          title: 'Не вдалося отримати копію',
          message: errorMessage(error),
        });
        return;
      }
      await restore(text, 'cloud', (message) =>
        showToast({ tone: 'error', title: 'Не вдалося відновити', message }),
      );
    });

  const restorePasted = () =>
    form.handleSubmit(({ json: pasted }) =>
      run('pasted', () =>
        restore(pasted.trim(), 'pasted', (message) => form.setError('json', { message })),
      ),
    )();

  return {
    control: form.control,
    keyError: errors.key?.message,
    pastedError: errors.json?.message,
    accountEmail: account?.email,
    canRestore: hasKey && !busySource,
    canRestorePasted: hasKey && json.trim().length > 0 && !busySource,
    busySource,
    restoreFromCloud,
    restoreFromFile,
    restorePasted,
  };
}
