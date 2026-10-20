import { ScrollView, StyleSheet } from 'react-native';

import { Button, Section, Typography, screenContent } from '@/shared/ui';
import { useBackupMock } from '@/features/backup';
import { themeStyles } from '@/shared/theme';

export default function BackupMockScreen() {
  const theme = themeStyles;
  const { holdingsCount, status, isBusy, saveMock, loadMock } = useBackupMock();

  return (
    <ScrollView
      style={theme.background}
      contentContainerStyle={screenContent}
      contentInsetAdjustmentBehavior="automatic"
    >
      {__DEV__ ? (
        <>
          {status && (
            <Typography
              variant="subhead"
              align="center"
              tone={status.error ? 'danger' : 'positive'}
            >
              {status.text}
            </Typography>
          )}
          <Section
            title="Мок на пристрої"
            footer="Мок зберігається у файловому сховищі цього пристрою."
          >
            <Typography variant="subhead" style={styles.body}>
              Зберегти поточні дані як мок, щоб завантажити їх пізніше.
            </Typography>
          </Section>
          <Button
            title="Зберегти як мок"
            onPress={saveMock}
            disabled={isBusy || holdingsCount === 0}
          />
          <Button
            title="Завантажити мок"
            variant="secondary"
            onPress={loadMock}
            disabled={isBusy}
          />
        </>
      ) : (
        <Typography variant="subhead" align="center" tone="secondary">
          Ця сторінка доступна лише в режимі розробки.
        </Typography>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingVertical: 14 },
});
