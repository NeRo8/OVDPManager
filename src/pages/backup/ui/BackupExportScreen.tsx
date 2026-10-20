import { purchaseCount, useBackupExport } from '@/features/backup';
import { Button, ScreenScrollView, Section, SectionText } from '@/shared/ui';
import { StatusMessage } from './StatusMessage';

export default function BackupExportScreen() {
  const { holdingsCount, status, exportFile } = useBackupExport();

  return (
    <ScreenScrollView>
      <StatusMessage status={status} />
      <Section
        title="Зберегти копію"
        footer="Дані гаманця зберігаються на цьому пристрої. Збережіть JSON-файл копії, щоб відновити їх після очищення даних чи на іншому пристрої."
      >
        <SectionText>У гаманці {purchaseCount(holdingsCount)}.</SectionText>
      </Section>
      <Button title="Експортувати копію" onPress={exportFile} disabled={holdingsCount === 0} />
    </ScreenScrollView>
  );
}
