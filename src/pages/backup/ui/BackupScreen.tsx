import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Button, Section, screenContent } from '@/shared/ui';
import { purchaseCount } from '@/features/backup';
import { useHoldings } from '@/entities/portfolio';
import { themeStyles } from '@/shared/theme';

export default function BackupScreen() {
  const theme = themeStyles;
  const holdings = useHoldings();

  return (
    <ScrollView
      style={theme.background}
      contentContainerStyle={screenContent}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Section title="Резервна копія">
        <Text style={[styles.body, theme.text]}>
          У гаманці {purchaseCount(holdings.length)}. Створіть файл копії або відновіть дані з
          нього.
        </Text>
      </Section>
      <Button title="Створити копію" onPress={() => router.push('/backup/export')} />
      <Button
        title="Завантажити копію в застосунок"
        variant="secondary"
        onPress={() => router.push('/backup/import')}
      />
      {__DEV__ && (
        <Button
          title="Мок для розробки"
          variant="secondary"
          onPress={() => router.push('/backup/mock')}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 15, paddingHorizontal: 16, paddingVertical: 14, lineHeight: 21 },
});
