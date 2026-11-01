import { useCloudAccount } from '@/features/backup';

import { formatDateTime } from '@/shared/lib';
import { ActionRow, InfoRow, Section } from '@/shared/ui';

function backupDateText(failed: boolean, exportedAt?: string): string {
  if (failed) return 'Не вдалося перевірити';
  if (exportedAt) return formatDateTime(exportedAt);
  return 'Ще немає';
}

/**
 * The Google account that holds the cloud backup: signing in and out, the copy's date, and removing
 * what the app keeps in the cloud. The copy itself is made and restored on the backup screens.
 */
export function CloudAccountSection() {
  const {
    account,
    cloudBackup,
    isCheckingBackup,
    backupCheckFailed,
    isBusy,
    signIn,
    signOut,
    deleteCloudData,
  } = useCloudAccount();

  if (!account) {
    return (
      <Section
        title="Хмарна копія"
        footer="Копія зберігається у Firebase під вашим Google-акаунтом і зашифрована вашим ключем: сервер бачить лише шифр. Так її можна відновити на будь-якому пристрої."
      >
        <ActionRow title="Увійти через Google" onPress={signIn} disabled={isBusy} />
      </Section>
    );
  }

  return (
    <Section
      title="Хмарна копія"
      footer="Зберегти копію в хмарі можна в «Створити копію», відновити — у «Відновити з копії» на будь-якому пристрої з цим акаунтом."
    >
      <InfoRow label="Google-акаунт" value={account.email ?? 'Адреса email недоступна'} />
      {account.email && (
        <InfoRow
          label="Копія в хмарі"
          value={backupDateText(backupCheckFailed, cloudBackup?.exportedAt)}
          loadingLabel={isCheckingBackup ? 'Перевіряємо копію в хмарі…' : undefined}
        />
      )}
      <ActionRow title="Вийти з акаунта" onPress={signOut} disabled={isBusy} />
      <ActionRow
        title="Видалити дані з хмари"
        tone="danger"
        onPress={deleteCloudData}
        disabled={isBusy || !account.email}
      />
    </Section>
  );
}
