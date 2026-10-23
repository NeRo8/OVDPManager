import { Tabs } from 'expo-router/js-tabs';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { useUnistyles } from 'react-native-unistyles';

import { PaymentFiltersButton } from '@/pages/payments';
import { PlanListButton } from '@/pages/plan';

export default function TabLayout() {
  // Navigator options are props, not styles, so the theme is read here. Tab icons are filled when
  // the tab is selected and outlined otherwise.
  const { theme: colors } = useUnistyles();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        // Every tab header ends in the same hairline in the theme's border color, instead of the
        // platform shadow (a grey line on iOS, an elevation shadow on Android).
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.headerBackground,
        },
        headerTintColor: colors.headerText,
      }}
    >
      <Tabs.Screen
        name="(payments)"
        options={{
          title: 'Виплати',
          // The top tabs continue the header, so the same line goes under them instead.
          headerStyle: { backgroundColor: colors.headerBackground },
          headerRight: () => <PaymentFiltersButton />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="holdings"
        options={{
          title: 'Гаманець',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'План',
          headerRight: () => <PlanListButton />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Налаштування',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
