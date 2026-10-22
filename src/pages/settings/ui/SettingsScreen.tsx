import { router } from 'expo-router';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useActivePlan } from '@/entities/portfolio';
import { planCount, purchaseCount, useBackupActions } from '@/features/backup';
import { setThemePreference, useThemePreference, type ThemePreference } from '@/shared/theme';
import {
  ActionRow,
  LinkRow,
  ScreenScrollView,
  Section,
  SegmentedSelect,
  Separator,
} from '@/shared/ui';

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: 'Системна', value: 'system' },
  { label: 'Світла', value: 'light' },
  { label: 'Темна', value: 'dark' },
];

export default function SettingsScreen() {
  const { numberOfPurchases, numberOfPlans, isBusy, exportBackup, saveMock, loadMock } =
    useBackupActions();
  const themePreference = useThemePreference();
  const activePlan = useActivePlan();

  return (
    <ScreenScrollView>
      <Section title="План" footer="Виплати, гаманець і прогноз показують покупки вибраного плану.">
        <LinkRow
          title="Активний план"
          subtitle={activePlan?.name}
          onPress={() => router.push('/plan/list')}
        />
      </Section>

      <Section
        title="Дані"
        footer={`У гаманці ${purchaseCount(numberOfPurchases)}, створено ${planCount(numberOfPlans)}. Дані зберігаються на цьому пристрої; копія у JSON-файлі дає змогу відновити їх тут чи на іншому пристрої.`}
      >
        <ActionRow
          title="Створити копію"
          onPress={exportBackup}
          disabled={isBusy || (numberOfPurchases === 0 && numberOfPlans === 0)}
        />
        <Separator />
        <LinkRow title="Відновити з копії" onPress={() => router.push('/backup/import')} />
      </Section>

      {__DEV__ && (
        <Section title="Розробка" footer="Мок зберігається у файловому сховищі цього пристрою.">
          <ActionRow
            title="Зберегти дані як мок"
            onPress={saveMock}
            disabled={isBusy || (numberOfPurchases === 0 && numberOfPlans === 0)}
          />
          <Separator />
          <ActionRow title="Завантажити мок" onPress={loadMock} disabled={isBusy} />
        </Section>
      )}

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
