import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useUnistyles } from 'react-native-unistyles';

import { useInvestmentPlans } from '@/entities/portfolio';
import { QueryProvider } from '@/shared/api';
import { HeaderButton, LaunchSplash, NativeStack, ToastHost } from '@/shared/ui';
import { goBackOrHome } from '@/shared/lib';

// LaunchSplash hides the native splash once it covers the screen; until then nothing shows through.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { theme, rt } = useUnistyles();
  const hasPlans = useInvestmentPlans().length > 0;
  const base = rt.themeName === 'dark' ? DarkTheme : DefaultTheme;
  // Navigator surfaces use the app palette; NativeStack sets the header colors itself.
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
          <StatusBar style="auto" />
          <NativeStack>
            {/* Purchases live in plans, so the app opens only once there is one. */}
            <NativeStack.Protected guard={hasPlans} redirectTo="/welcome">
              {/* Each tab draws its own header in its own stack. */}
              <NativeStack.Screen name="(tabs)" options={{ headerShown: false }} />
              {/* Adding a purchase to the active plan: choose a bond, then enter the purchase. */}
              <NativeStack.Screen name="add/index" options={{ title: 'Оберіть ОВДП' }} />
              <NativeStack.Screen name="add/[isin]" options={{ title: 'Додати ОВДП' }} />
              <NativeStack.Screen name="plan/name" options={{ title: 'Новий план' }} />
              <NativeStack.Screen name="plan/list" options={{ title: 'Мої плани' }} />
              <NativeStack.Screen
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
              <NativeStack.Screen name="bond/[isin]" options={{ title: 'ОВДП' }} />
              <NativeStack.Screen name="backup/export" options={{ title: 'Створити копію' }} />
            </NativeStack.Protected>
            <NativeStack.Protected guard={!hasPlans} redirectTo="/">
              <NativeStack.Screen name="welcome" options={{ title: 'Перший план' }} />
            </NativeStack.Protected>
            {/* Reachable without plans too: a backup brings its plans along. */}
            <NativeStack.Screen name="backup/import" options={{ title: 'Відновити з копії' }} />
          </NativeStack>
          <ToastHost />
          <LaunchSplash />
        </ThemeProvider>
      </QueryProvider>
    </KeyboardProvider>
  );
}
