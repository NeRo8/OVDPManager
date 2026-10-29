import { router } from 'expo-router';
import { Controller } from 'react-hook-form';

import { useBackupExport } from '@/features/backup';

import { Button, PasswordInput, FormScrollView, Section, Typography } from '@/shared/ui';

/**
 * Making a backup: the key that encrypts it, typed twice, then the Google account's cloud copy or
 * a file from the share sheet.
 */
export default function BackupExportScreen() {
  const {
    control,
    keyError,
    confirmationError,
    accountEmail,
    canExport,
    exportingTo,
    exportToFile,
    uploadToCloud,
  } = useBackupExport(() => router.back());
  const error = keyError ?? confirmationError;
  const saveToCloud = () => void uploadToCloud();
  const saveToFile = () => void exportToFile();

  return (
    <FormScrollView>
      <Section
        title="Ключ копії"
        footer={
          error ? (
            <Typography variant="caption1" tone="danger" accessibilityLiveRegion="polite">
              {error}
            </Typography>
          ) : (
            'Копія шифрується цим ключем, і без нього її не відновити: ні тут, ні на іншому пристрої. Збережіть ключ, наприклад у менеджері паролів.'
          )
        }
      >
        <Controller
          control={control}
          name="key"
          render={({ field }) => (
            <PasswordInput
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Ключ, щонайменше 8 символів"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              autoComplete="new-password"
              autoFocus
            />
          )}
        />
        <Controller
          control={control}
          name="confirmation"
          render={({ field }) => (
            <PasswordInput
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Ключ ще раз"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              autoComplete="new-password"
            />
          )}
        />
      </Section>
      <Section
        title="У хмарі"
        footer={
          accountEmail
            ? `Копія належить акаунту ${accountEmail} і замінює попередню. Відновити її можна на будь-якому пристрої, увійшовши в цей акаунт.`
            : 'Застосунок попросить увійти через Google. Відновити копію можна на будь-якому пристрої з тим самим акаунтом.'
        }
      >
        <Button
          title={exportingTo === 'cloud' ? 'Зберігаємо…' : 'Зберегти в хмарі'}
          disabled={!canExport}
          onPress={saveToCloud}
        />
      </Section>
      <Section title="У файлі" footer="JSON-файл можна зберегти чи надіслати з меню «Поділитися».">
        <Button
          title={exportingTo === 'file' ? 'Шифруємо…' : 'Зберегти у файл…'}
          variant="secondary"
          disabled={!canExport}
          onPress={saveToFile}
        />
      </Section>
    </FormScrollView>
  );
}
