import { ScrollView } from 'react-native';

import { Button, Input, Section, Typography, screenContent } from '@/shared/ui';
import { useBackupImport } from '@/features/backup';
import { themeStyles } from '@/shared/theme';

export default function BackupImportScreen() {
  const theme = themeStyles;
  const { pasted, setPasted, status, restoreFromFile, restorePasted } = useBackupImport();

  return (
    <ScrollView
      style={theme.background}
      contentContainerStyle={screenContent}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      {status && (
        <Typography variant="subhead" align="center" tone={status.error ? 'danger' : 'positive'}>
          {status.text}
        </Typography>
      )}
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
    </ScrollView>
  );
}
