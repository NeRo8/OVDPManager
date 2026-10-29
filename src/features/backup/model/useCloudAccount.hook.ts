import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { confirmDestructive, showToast } from '@/shared/lib';

import { deleteCloudBackup } from '../api/cloudBackup';
import {
  deleteSignedInUser,
  getSignedInUser,
  reauthenticateWithGoogle,
  signInWithGoogle,
  signOutOfGoogle,
} from '../api/googleAccount';
import { cloudBackupQueryKey, useCloudBackup } from '../api/useCloudBackup.hook';

import { errorMessage } from './errorMessage';
import { useGoogleAccount } from './useGoogleAccount.hook';

/**
 * The Google account behind the cloud backup: who is signed in, the copy it holds, and signing in,
 * out, or removing everything the app keeps in the cloud. Outcomes come as toasts.
 */
export function useCloudAccount() {
  const account = useGoogleAccount();
  const cloudBackup = useCloudBackup(account?.uid);
  const queryClient = useQueryClient();
  const [isBusy, setBusy] = useState(false);

  async function run(failureTitle: string, action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      showToast({ tone: 'error', title: failureTitle, message: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  const signIn = () =>
    void run('Не вдалося увійти через Google', async () => {
      await signInWithGoogle();
    });

  const signOut = () =>
    void run('Не вдалося вийти', async () => {
      await signOutOfGoogle();
      showToast({ tone: 'info', title: 'Ви вийшли з Google-акаунта' });
    });

  const removeCloudData = () =>
    run('Не вдалося видалити дані з хмари', async () => {
      const user = getSignedInUser();
      if (!account || !user) return;
      // Google confirms the account first, so closing that sheet leaves everything in place.
      if (!(await reauthenticateWithGoogle(user))) return;
      // The copy goes while the user still exists: the security rules check its owner.
      await deleteCloudBackup(account.uid);
      await deleteSignedInUser(user);
      queryClient.removeQueries({ queryKey: cloudBackupQueryKey(account.uid) });
      showToast({ tone: 'success', title: 'Дані видалено з хмари', message: account.email });
    });

  const deleteCloudData = () =>
    confirmDestructive(
      'Видалити дані з хмари?',
      'Копію буде видалено з хмари, а Google-акаунт від’єднано від застосунку. Плани й купівлі на цьому пристрої залишаться.',
      'Видалити',
      () => void removeCloudData(),
    );

  return {
    account,
    cloudBackup: cloudBackup.data,
    isCheckingBackup: cloudBackup.isLoading,
    backupCheckFailed: cloudBackup.isError,
    isBusy,
    signIn,
    signOut,
    deleteCloudData,
  };
}
