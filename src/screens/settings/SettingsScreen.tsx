import { View } from 'react-native';

import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { SegmentedSelect } from '@/components/form/SegmentedSelect';
import { InfoRow } from '@/components/layout/InfoRow';
import { LinkRow } from '@/components/layout/LinkRow';
import { OnlineOnly } from '@/components/layout/OnlineOnly';
import { ScreenScrollView } from '@/components/layout/ScreenScrollView';
import { Section } from '@/components/layout/Section';
import { useBonds } from '@/hooks/useBonds.hook';
import { useKeyRate, useKeyRateUpdatedAt } from '@/hooks/useKeyRate.hook';
import { planCount, operationCount } from '@/lib/portfolio/counts';
import { useToday, useThemePreference, type ThemePreference } from '@/stores/appSettings';
import { showToast } from '@/stores/appSettings';
import { useOperations } from '@/stores/operations';
import { useInvestmentPlans } from '@/stores/plans';
import { setThemePreference } from '@/theme/themePreference';
import { formatDateTime } from '@/utils/date';

import { CloudAccountSection } from './CloudAccountSection';

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: 'Системна', value: 'system' },
  { label: 'Світла', value: 'light' },
  { label: 'Темна', value: 'dark' },
];

export default function SettingsScreen() {
  const numberOfPurchases = useOperations().length;
  const numberOfPlans = useInvestmentPlans().length;
  const themePreference = useThemePreference();
  const { updatedAt } = useBonds();
  const today = useToday();
  useKeyRate(today);
  const rateUpdatedAt = useKeyRateUpdatedAt(today);
  const openBackupExport = () => router.push('/backup/export');
  const openBackupImport = () => router.push('/backup/import');
  const openLink = (url: string) =>
    void Linking.openURL(url).catch(() =>
      showToast({ tone: 'error', title: 'Не вдалося відкрити посилання' }),
    );

  return (
    <ScreenScrollView>
      <Section
        title="Дані"
        footer={`Створено ${planCount(numberOfPlans)}. Усього ${operationCount(numberOfPurchases)}. Дані на пристрої не шифруються застосунком; захист залежить від налаштувань пристрою. Копія у хмарі чи файлі зашифрована вашим ключем.`}
      >
        <LinkRow title="Створити копію" onPress={openBackupExport} />
        <LinkRow title="Відновити з копії" onPress={openBackupImport} />
      </Section>

      <OnlineOnly offlineMessage="Немає зв’язку з інтернетом — хмарна копія з’явиться тут, щойно зв’язок відновиться.">
        <CloudAccountSection />
      </OnlineOnly>

      <Section title="Оформлення" footer="Системна тема повторює світлий чи темний режим пристрою.">
        <View style={styles.themePicker}>
          <SegmentedSelect
            options={THEME_OPTIONS}
            value={themePreference}
            onChange={setThemePreference}
          />
        </View>
      </Section>
      <Section title="Про застосунок">
        <InfoRow label="Версія" value={Constants.expoConfig?.version ?? '—'} />
        <InfoRow
          label="Дані НБУ оновлено"
          value={
            updatedAt ? formatDateTime(new Date(updatedAt).toISOString()) : 'Ще не завантажено'
          }
        />
        <InfoRow
          label="Облікову ставку оновлено"
          value={
            rateUpdatedAt
              ? formatDateTime(new Date(rateUpdatedAt).toISOString())
              : 'Ще не завантажено'
          }
        />
        <LinkRow title="Переглянути вступ" onPress={() => router.push('/intro')} />
        <LinkRow
          title="Підтримка"
          onPress={() => openLink('https://nero8.github.io/OVDPManager/')}
        />
        <LinkRow
          title="Політика приватності"
          onPress={() => openLink('https://nero8.github.io/OVDPManager/privacy.html')}
        />
      </Section>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  themePicker: { padding: theme.space.md },
}));
