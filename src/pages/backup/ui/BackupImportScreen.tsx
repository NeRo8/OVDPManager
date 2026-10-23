import { Controller } from 'react-hook-form';

import { useBackupImport } from '@/features/backup';
import { Button, Input, ScreenScrollView, Section, Typography } from '@/shared/ui';

export default function BackupImportScreen() {
  const {
    control,
    keyError,
    pastedError,
    canRestoreFile,
    canRestorePasted,
    isBusy,
    restoreFromFile,
    restorePasted,
  } = useBackupImport();

  return (
    <ScreenScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <Section
        title="Ключ копії"
        footer={
          keyError ? (
            <Typography variant="caption1" tone="danger" accessibilityLiveRegion="polite">
              {keyError}
            </Typography>
          ) : (
            'Ключ, яким копію зашифрували під час створення.'
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
              placeholder="Ключ копії"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              autoComplete="current-password"
            />
          )}
        />
      </Section>
      <Section
        title="Відновити з копії"
        footer="Усі поточні плани та їхні покупки буде замінено даними з копії."
      >
        <Button
          title={isBusy ? 'Розшифровуємо…' : 'Вибрати JSON-файл копії…'}
          onPress={() => void restoreFromFile()}
          disabled={!canRestoreFile}
        />
      </Section>
      <Section
        title="Або вставити JSON вручну"
        footer={
          pastedError && (
            <Typography variant="caption1" tone="danger" accessibilityLiveRegion="polite">
              {pastedError}
            </Typography>
          )
        }
      >
        <Controller
          control={control}
          name="json"
          render={({ field }) => (
            <Input
              variant="area"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Вставте сюди вміст файлу копії"
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        />
      </Section>
      <Button
        title="Відновити зі вставленого"
        variant="secondary"
        onPress={() => void restorePasted()}
        disabled={!canRestorePasted}
      />
    </ScreenScrollView>
  );
}
