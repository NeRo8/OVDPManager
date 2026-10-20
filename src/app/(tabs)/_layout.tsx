import { Tabs, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { HeaderButton } from '@/shared/ui';
import { useColors } from '@/shared/theme';

export default function TabLayout() {
  const colors = useColors();

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
        name="index"
        options={{
          title: 'Майбутні виплати',
          tabBarLabel: 'Виплати',
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
        name="schedule"
        options={{
          title: 'Графік виплат',
          tabBarLabel: 'Графік',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'chart.bar', android: 'bar_chart' }}
              size={24}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="holdings"
        options={{
          title: 'Мої ОВДП',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'square.stack.3d.up',
                android: 'account_balance_wallet',
              }}
              size={24}
              tintColor={color}
            />
          ),
          headerRight: () => <HeaderButton title="Додати" onPress={() => router.push('/add')} />,
        }}
      />
      <Tabs.Screen
        name="backup"
        options={{
          title: 'Резервна копія',
          tabBarLabel: 'Копія',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'archivebox', android: 'backup' }}
              size={24}
              tintColor={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
