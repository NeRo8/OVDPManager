import { useBackupImport } from '@/features/backup';
import { Button, Input, ScreenScrollView, Section } from '@/shared/ui';
import { StatusMessage } from './StatusMessage';

export default function BackupImportScreen() {
  const { pasted, setPasted, status, restoreFromFile, restorePasted } = useBackupImport();

  return (
    <ScreenScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <StatusMessage status={status} />
      <Section
        title="Відновити з копії"
        footer="Поточні дані гаманця буде замінено даними з копії."
      >
        <Button title="Вибрати JSON-файл копії…" onPress={restoreFromFile} />
      </Section>
      <Section title="Або вставити JSON вручну">
        <Input
          variant="area"
          value={pasted}
          onChangeText={setPasted}
          placeholder="Вставте сюди вміст файлу копії"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Section>
      <Button
        title="Відновити зі вставленого"
        variant="secondary"
        onPress={restorePasted}
        disabled={!pasted.trim()}
      />
    </ScreenScrollView>
  );
}
