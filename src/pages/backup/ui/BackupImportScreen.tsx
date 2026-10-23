import { Controller } from 'react-hook-form';

import { useBackupImport } from '@/features/backup';
import { Button, Input, PasswordInput, FormScrollView, Section, Typography } from '@/shared/ui';

export default function BackupImportScreen() {
  const {
    control,
    keyError,
    pastedError,
    accountEmail,
    canRestore,
    canRestorePasted,
    isBusy,
    restoreFromCloud,
    restoreFromFile,
    restorePasted,
  } = useBackupImport();
  const loadFromCloud = () => void restoreFromCloud();
  const pickFile = () => void restoreFromFile();
  const restoreFromPasted = () => void restorePasted();

  return (
    <FormScrollView>
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
            <PasswordInput
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Ключ копії"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              autoComplete="current-password"
            />
          )}
        />
      </Section>
      <Section
        title="З хмари"
        footer={
          accountEmail
            ? `Копія акаунта ${accountEmail}. Усі поточні плани та їхні купівлі буде замінено даними з копії.`
            : 'Застосунок попросить увійти в Google-акаунт, з якого копію зберегли. Усі поточні плани та їхні купівлі буде замінено даними з копії.'
        }
      >
        <Button
          title={isBusy ? 'Розшифровуємо…' : 'Відновити з хмари'}
          onPress={loadFromCloud}
          disabled={!canRestore}
        />
      </Section>
      <Section
        title="З файлу"
        footer="Усі поточні плани та їхні купівлі буде замінено даними з копії."
      >
        <Button
          title="Вибрати JSON-файл копії…"
          variant="secondary"
          onPress={pickFile}
          disabled={!canRestore}
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
        onPress={restoreFromPasted}
        disabled={!canRestorePasted}
      />
    </FormScrollView>
  );
}
