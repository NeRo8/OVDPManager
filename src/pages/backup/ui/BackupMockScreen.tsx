import { ScrollView, StyleSheet, Text } from 'react-native';

import { Button, Section, screenContent } from '@/shared/ui';
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
            <Text style={[styles.status, status.error ? theme.dangerText : theme.positiveText]}>
              {status.text}
            </Text>
          )}
          <Section
            title="Мок на пристрої"
            footer="Мок зберігається у файловому сховищі цього пристрою."
          >
            <Text style={[styles.body, theme.text]}>
              Зберегти поточні дані як мок, щоб завантажити їх пізніше.
            </Text>
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
        <Text style={[styles.status, theme.secondaryText]}>
          Ця сторінка доступна лише в режимі розробки.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  status: { fontSize: 15, textAlign: 'center' },
  body: { fontSize: 15, paddingHorizontal: 16, paddingVertical: 14 },
});
