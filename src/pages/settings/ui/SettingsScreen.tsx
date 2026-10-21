import { router } from 'expo-router';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useHoldings } from '@/entities/portfolio';
import { purchaseCount } from '@/features/backup';
import { setThemePreference, useThemePreference, type ThemePreference } from '@/shared/theme';
import { LinkRow, ScreenScrollView, Section, SegmentedSelect, Separator } from '@/shared/ui';

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: 'Системна', value: 'system' },
  { label: 'Світла', value: 'light' },
  { label: 'Темна', value: 'dark' },
];

export default function SettingsScreen() {
  const holdings = useHoldings();
  const themePreference = useThemePreference();

  return (
    <ScreenScrollView>
      <Section
        title="Дані"
        footer={`У гаманці ${purchaseCount(holdings.length)}. Дані зберігаються на цьому пристрої; копія у JSON-файлі дає змогу відновити їх тут чи на іншому пристрої.`}
      >
        <LinkRow title="Створити копію" onPress={() => router.push('/backup/export')} />
        <Separator />
        <LinkRow title="Відновити з копії" onPress={() => router.push('/backup/import')} />
        {__DEV__ && (
          <>
            <Separator />
            <LinkRow title="Мок для розробки" onPress={() => router.push('/backup/mock')} />
          </>
        )}
      </Section>

      <Section title="Оформлення" footer="Системна тема повторює світлий чи темний режим пристрою.">
        <View style={styles.themePicker}>
          <SegmentedSelect
            options={THEME_OPTIONS}
            value={themePreference}
            onChange={setThemePreference}
          />
        </View>
      </Section>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  themePicker: { padding: 12 },
});
