import { router } from 'expo-router';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useInvestmentPlans, usePurchases } from '@/entities/portfolio';
import { planCount, purchaseCount } from '@/features/backup';
import { setThemePreference, useThemePreference, type ThemePreference } from '@/shared/theme';
import { LinkRow, ScreenScrollView, Section, SegmentedSelect, Separator } from '@/shared/ui';

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: 'Системна', value: 'system' },
  { label: 'Світла', value: 'light' },
  { label: 'Темна', value: 'dark' },
];

export default function SettingsScreen() {
  const numberOfPurchases = usePurchases().length;
  const numberOfPlans = useInvestmentPlans().length;
  const themePreference = useThemePreference();
  const openBackupExport = () => router.push('/backup/export');
  const openBackupImport = () => router.push('/backup/import');

  return (
    <ScreenScrollView>
      <Section
        title="Дані"
        footer={`Створено ${planCount(numberOfPlans)}, ${numberOfPlans === 1 ? 'у ньому' : 'у них'} ${purchaseCount(numberOfPurchases)}. Дані зберігаються на цьому пристрої; зашифрована вашим ключем копія у JSON-файлі дає змогу відновити їх тут чи на іншому пристрої.`}
      >
        <LinkRow title="Створити копію" onPress={openBackupExport} />
        <Separator />
        <LinkRow title="Відновити з копії" onPress={openBackupImport} />
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

const styles = StyleSheet.create((theme) => ({
  themePicker: { padding: theme.space.md },
}));
