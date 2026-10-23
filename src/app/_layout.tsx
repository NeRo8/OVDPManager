import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useUnistyles } from 'react-native-unistyles';

import { useInvestmentPlans } from '@/entities/portfolio';
import { QueryProvider } from '@/shared/api';
import { HeaderButton, ToastHost } from '@/shared/ui';
import { goBackOrHome } from '@/shared/lib';

export default function RootLayout() {
  const { theme, rt } = useUnistyles();
  const hasPlans = useInvestmentPlans().length > 0;
  const base = rt.themeName === 'dark' ? DarkTheme : DefaultTheme;
  // Navigator surfaces use the app palette; headers have their own brand colors below.
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.accent,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
    },
  };

  return (
    <KeyboardProvider>
      <QueryProvider>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerBackButtonDisplayMode: 'minimal',
              headerStyle: { backgroundColor: theme.headerBackground },
              headerTintColor: theme.headerText,
              headerUserInterfaceStyle: 'dark',
            }}
          >
            {/* Purchases live in plans, so the app opens only once there is one. */}
            <Stack.Protected guard={hasPlans} redirectTo="/welcome">
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              {/* Adding a purchase to the active plan: choose a bond, then enter the purchase. */}
              <Stack.Screen name="add/index" options={{ title: 'Оберіть ОВДП' }} />
              <Stack.Screen name="add/[isin]" options={{ title: 'Додати ОВДП' }} />
              <Stack.Screen name="plan/name" options={{ title: 'Новий план' }} />
              <Stack.Screen name="plan/list" options={{ title: 'Мої плани' }} />
              <Stack.Screen
                name="payment-filters"
                options={{
                  title: 'Фільтри виплат',
                  presentation: 'modal',
                  headerLeft: () => (
                    <HeaderButton
                      icon="close"
                      accessibilityLabel="Закрити"
                      onPress={goBackOrHome}
                    />
                  ),
                }}
              />
              <Stack.Screen name="bond/[isin]" options={{ title: 'ОВДП' }} />
              <Stack.Screen name="backup/export" options={{ title: 'Створити копію' }} />
            </Stack.Protected>
            <Stack.Protected guard={!hasPlans} redirectTo="/">
              <Stack.Screen name="welcome" options={{ title: 'Перший план' }} />
            </Stack.Protected>
            {/* Reachable without plans too: a backup brings its plans along. */}
            <Stack.Screen name="backup/import" options={{ title: 'Відновити з копії' }} />
          </Stack>
          <ToastHost />
        </ThemeProvider>
      </QueryProvider>
    </KeyboardProvider>
  );
}
