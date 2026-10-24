import { NativeTabs } from 'expo-router/native-tabs';
import { useUnistyles } from 'react-native-unistyles';

import { fontFamily, fontWeights } from '@/shared/theme';

/**
 * The platform's own tab bar: Liquid Glass on iOS 26, Material on Android. Native tabs draw no
 * headers, so each tab is a folder with its own stack. Icons are SF Symbols on iOS and Material
 * Symbols on Android; a selected tab's SF Symbol is filled where the symbol has a filled form.
 */
export default function TabLayout() {
  // Navigator options are props, not styles, so the theme is read here.
  const { theme } = useUnistyles();

  return (
    <NativeTabs
      tintColor={theme.accent}
      // iOS 26 draws the glass bar itself; these color it on Android and older iOS.
      backgroundColor={theme.card}
      indicatorColor={theme.muted}
      // Android shows only the selected tab's label by default; every tab keeps its name here.
      labelVisibilityMode="labeled"
      labelStyle={{ fontFamily, fontWeight: fontWeights.medium }}
    >
      <NativeTabs.Trigger name="(payments)">
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
        <NativeTabs.Trigger.Label>Виплати</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(holdings)">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'wallet.bifold', selected: 'wallet.bifold.fill' }}
          md="account_balance_wallet"
        />
        <NativeTabs.Trigger.Label>Гаманець</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(reports)">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'doc.text', selected: 'doc.text.fill' }}
          md="summarize"
        />
        <NativeTabs.Trigger.Label>Звіти</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(plan)">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
          md="bar_chart"
        />
        <NativeTabs.Trigger.Label>План</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(settings)">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          md="settings"
        />
        <NativeTabs.Trigger.Label>Налаштування</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
