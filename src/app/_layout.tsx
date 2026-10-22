import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';

import { useInvestmentPlans } from '@/entities/portfolio';
import { HeaderButton, ToastHost } from '@/shared/ui';
import { goBackOrHome } from '@/shared/lib';

export default function RootLayout() {
  const { theme, rt } = useUnistyles();
  const hasPlans = useInvestmentPlans().length > 0;
  const base = rt.themeName === 'dark' ? DarkTheme : DefaultTheme;
  // Headers and navigator chrome take the app palette, so they match the top tabs and cards.
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
    <ThemeProvider value={navigationTheme}>
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
        {/* Purchases live in plans, so the app opens only once there is one. */}
        <Stack.Protected guard={hasPlans} redirectTo="/welcome">
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* Adding a purchase: choose a bond, then enter the purchase (or plan it, with `planId`). */}
          <Stack.Screen name="add/index" options={{ title: 'Оберіть ОВДП' }} />
          <Stack.Screen name="add/[isin]" options={{ title: 'Додати ОВДП' }} />
          <Stack.Screen name="plan/name" options={{ title: 'Новий план' }} />
          <Stack.Screen name="plan/new/[isin]" options={{ title: 'План покупки' }} />
          <Stack.Screen name="plan/edit/[id]" options={{ title: 'Змінити план' }} />
          <Stack.Screen name="plan/list" options={{ title: 'Мої плани' }} />
          <Stack.Screen
            name="payment-filters"
            options={{
              title: 'Фільтри виплат',
              presentation: 'modal',
              headerLeft: () => (
                <HeaderButton icon="close" accessibilityLabel="Закрити" onPress={goBackOrHome} />
              ),
            }}
          />
          <Stack.Screen name="bond/[isin]" options={{ title: 'ОВДП' }} />
        </Stack.Protected>
        <Stack.Protected guard={!hasPlans} redirectTo="/">
          <Stack.Screen name="welcome" options={{ title: 'Перший план' }} />
        </Stack.Protected>
        {/* Reachable without plans too: a backup brings its plans along. */}
        <Stack.Screen name="backup/import" options={{ title: 'Відновити з копії' }} />
      </Stack>
      <ToastHost />
    </ThemeProvider>
  );
}
