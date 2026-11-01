import { useCloudAccount } from '@/features/backup';

import { formatDateTime } from '@/shared/lib';
import { ActionRow, InfoRow, Section, SkeletonBlock, SkeletonGroup } from '@/shared/ui';

type BackupDateValueProps = {
  isChecking: boolean;
  failed: boolean;
  exportedAt?: string;
};

function BackupDateValue({ isChecking, failed, exportedAt }: BackupDateValueProps) {
  if (isChecking) {
    return (
      <SkeletonGroup label="Перевіряємо копію в хмарі…">
        <SkeletonBlock width={120} height={14} />
      </SkeletonGroup>
    );
  }
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
          value={
            <BackupDateValue
              isChecking={isCheckingBackup}
              failed={backupCheckFailed}
              exportedAt={cloudBackup?.exportedAt}
            />
          }
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
