import { Tabs } from 'expo-router/js-tabs';
import { SymbolView } from 'expo-symbols';
import { useUnistyles } from 'react-native-unistyles';

import { PaymentFiltersButton } from '@/pages/payments';
import { PlanListButton } from '@/pages/plan';

export default function TabLayout() {
  // Navigator options are props, not styles, so the theme is read here.
  const { theme: colors } = useUnistyles();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="(payments)"
        options={{
          title: 'Виплати',
          // The top tabs continue the header, so the line goes under them instead.
          headerShadowVisible: false,
          headerRight: () => <PaymentFiltersButton />,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'calendar', android: 'calendar_month' }}
              size={24}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="holdings"
        options={{
          title: 'Гаманець',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'wallet.bifold', android: 'account_balance_wallet' }}
              size={24}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Плани',
          headerRight: () => <PlanListButton />,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'chart.bar.xaxis', android: 'bar_chart' }}
              size={24}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Налаштування',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'gearshape', android: 'settings' }}
              size={24}
              tintColor={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
