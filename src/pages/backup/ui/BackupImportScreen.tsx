import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { Button, Section, screenContent } from '@/shared/ui';
import { useBackupImport } from '@/features/backup';
import { useColors, themeStyles } from '@/shared/theme';

export default function BackupImportScreen() {
  const colors = useColors();
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
        <Text style={[styles.status, status.error ? theme.dangerText : theme.positiveText]}>
          {status.text}
        </Text>
      )}
      <Section
        title="Відновити з копії"
        footer="Поточні дані гаманця буде замінено даними з копії."
      >
        <Button title="Вибрати JSON-файл копії…" onPress={restoreFromFile} />
      </Section>
      <Section title="Або вставити JSON вручну">
        <TextInput
          value={pasted}
          onChangeText={setPasted}
          placeholder="Вставте сюди вміст файлу копії"
          placeholderTextColor={colors.secondaryText}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.textArea, theme.text]}
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

const styles = StyleSheet.create({
  status: { fontSize: 15, textAlign: 'center' },
  textArea: {
    fontSize: 13,
    fontFamily: 'monospace',
    minHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
});
