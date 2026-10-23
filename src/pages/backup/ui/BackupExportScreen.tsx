import { router } from 'expo-router';
import { Controller } from 'react-hook-form';

import { useBackupExport } from '@/features/backup';
import { Button, Input, FormScrollView, Section, Separator, Typography } from '@/shared/ui';

/** Making a backup: the key that encrypts it, typed twice, then the share sheet. */
export default function BackupExportScreen() {
  const { control, keyError, confirmationError, canExport, isExporting, exportBackup } =
    useBackupExport(() => router.back());
  const error = keyError ?? confirmationError;
  const save = () => void exportBackup();

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
            <Input
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Ключ, щонайменше 8 символів"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              autoComplete="new-password"
              autoFocus
            />
          )}
        />
        <Separator />
        <Controller
          control={control}
          name="confirmation"
          render={({ field }) => (
            <Input
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Ключ ще раз"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              autoComplete="new-password"
            />
          )}
        />
      </Section>
      <Button
        title={isExporting ? 'Шифруємо…' : 'Створити копію'}
        disabled={!canExport}
        onPress={save}
      />
    </FormScrollView>
  );
}
