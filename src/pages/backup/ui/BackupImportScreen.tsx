import { Controller } from 'react-hook-form';

import { useBackupImport } from '@/features/backup';
import { Button, Input, ScreenScrollView, Section, Typography } from '@/shared/ui';

export default function BackupImportScreen() {
  const { control, pastedError, canRestorePasted, restoreFromFile, restorePasted } =
    useBackupImport();

  return (
    <ScreenScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <Section
        title="Відновити з копії"
        footer="Усі поточні плани та їхні покупки буде замінено даними з копії."
      >
        <Button title="Вибрати JSON-файл копії…" onPress={restoreFromFile} />
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
