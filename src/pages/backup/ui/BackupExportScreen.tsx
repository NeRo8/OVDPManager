import { ScrollView, StyleSheet } from 'react-native';

import { Button, Section, Typography, screenContent } from '@/shared/ui';
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
        <Typography variant="subhead" align="center" tone={status.error ? 'danger' : 'positive'}>
          {status.text}
        </Typography>
      )}
      <Section
        title="Зберегти копію"
        footer="Дані гаманця зберігаються на цьому пристрої. Збережіть JSON-файл копії, щоб відновити їх після очищення даних чи на іншому пристрої."
      >
        <Typography variant="subhead" style={styles.body}>
          У гаманці {purchaseCount(holdingsCount)}.
        </Typography>
      </Section>
      <Button title="Експортувати копію" onPress={exportFile} disabled={holdingsCount === 0} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingVertical: 14 },
});
