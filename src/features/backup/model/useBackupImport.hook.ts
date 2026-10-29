import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFormState, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { showToast } from '@/shared/lib';

import { pickBackupFile } from '../api/backupFile';
import { fetchCloudBackup } from '../api/cloudBackup';
import { ensureGoogleAccount } from '../api/googleAccount';
import { WrongBackupKeyError } from '../lib/backupCipher';

import { parseBackup } from './backup';
import { BackupKeySchema } from './backupKey.schema';
import { errorMessage } from './errorMessage';
import { type BackupSource, restoreBackup } from './restoreBackup';
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

  async function restore(text: string, source: BackupSource, showError: (message: string) => void) {
    setBusy(true);
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
      await restore(text, 'file', (message) =>
        showToast({ tone: 'error', title: 'Не вдалося відновити', message }),
      );
    }
  }

  async function restoreFromCloud() {
    setBusy(true);
    let text: string;
    try {
      const signedIn = await ensureGoogleAccount();
      const cloudBackup = signedIn && (await fetchCloudBackup(signedIn.uid));
      if (!cloudBackup) {
        if (signedIn) {
          showToast({ tone: 'info', title: 'У хмарі немає копії', message: signedIn.email });
        }
        setBusy(false);
        return;
      }
      text = cloudBackup.backup;
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'Не вдалося отримати копію',
        message: errorMessage(error),
      });
      setBusy(false);
      return;
    }
    await restore(text, 'cloud', (message) =>
      showToast({ tone: 'error', title: 'Не вдалося відновити', message }),
    );
  }

  const restorePasted = form.handleSubmit(({ json: pasted }) =>
    restore(pasted.trim(), 'pasted', (message) => form.setError('json', { message })),
  );

  return {
    control: form.control,
    keyError: errors.key?.message,
    pastedError: errors.json?.message,
    accountEmail: account?.email,
    canRestore: hasKey && !isBusy,
    canRestorePasted: hasKey && json.trim().length > 0 && !isBusy,
    isBusy,
    restoreFromCloud,
    restoreFromFile,
    restorePasted,
  };
}
