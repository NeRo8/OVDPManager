import { useBackupMock } from '@/features/backup';
import { Button, ScreenScrollView, Section, SectionText, Typography } from '@/shared/ui';
import { StatusMessage } from './StatusMessage';

export default function BackupMockScreen() {
  const { holdingsCount, status, isBusy, saveMock, loadMock } = useBackupMock();

  if (!__DEV__) {
    return (
      <ScreenScrollView>
        <Typography variant="subhead" align="center" tone="secondary">
          Ця сторінка доступна лише в режимі розробки.
        </Typography>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView>
      <StatusMessage status={status} />
      <Section
        title="Мок на пристрої"
        footer="Мок зберігається у файловому сховищі цього пристрою."
      >
        <SectionText>Зберегти поточні дані як мок, щоб завантажити їх пізніше.</SectionText>
      </Section>
      <Button title="Зберегти як мок" onPress={saveMock} disabled={isBusy || holdingsCount === 0} />
      <Button title="Завантажити мок" variant="secondary" onPress={loadMock} disabled={isBusy} />
    </ScreenScrollView>
  );
}
