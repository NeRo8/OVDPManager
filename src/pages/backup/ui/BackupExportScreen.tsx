import { ScrollView, StyleSheet, Text } from 'react-native';

import { Button, Section, screenContent } from '@/shared/ui';
import { purchaseCount, useBackupExport } from '@/features/backup';
import { themeStyles } from '@/shared/theme';

export default function BackupExportScreen() {
  const theme = themeStyles;
  const { holdingsCount, status, exportFile } = useBackupExport();

  return (
    <ScrollView
      style={theme.background}
      contentContainerStyle={screenContent}
      contentInsetAdjustmentBehavior="automatic"
    >
      {status && (
        <Text style={[styles.status, status.error ? theme.dangerText : theme.positiveText]}>
          {status.text}
        </Text>
      )}
      <Section
        title="Зберегти копію"
        footer="Дані гаманця зберігаються на цьому пристрої. Збережіть JSON-файл копії, щоб відновити їх після очищення даних чи на іншому пристрої."
      >
        <Text style={[styles.body, theme.text]}>У гаманці {purchaseCount(holdingsCount)}.</Text>
      </Section>
      <Button title="Експортувати копію" onPress={exportFile} disabled={holdingsCount === 0} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  status: { fontSize: 15, textAlign: 'center' },
  body: { fontSize: 15, paddingHorizontal: 16, paddingVertical: 14 },
});
