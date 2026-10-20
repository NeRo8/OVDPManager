import { router } from 'expo-router';

import { useHoldings } from '@/entities/portfolio';
import { purchaseCount } from '@/features/backup';
import { Button, ScreenScrollView, Section, SectionText } from '@/shared/ui';

export default function BackupScreen() {
  const holdings = useHoldings();

  return (
    <ScreenScrollView>
      <Section title="Резервна копія">
        <SectionText>
          У гаманці {purchaseCount(holdings.length)}. Створіть файл копії або відновіть дані з
          нього.
        </SectionText>
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
    </ScreenScrollView>
  );
}
