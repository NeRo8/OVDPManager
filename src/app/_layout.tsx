import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useUnistyles } from 'react-native-unistyles';

import { useInvestmentPlans } from '@/entities/portfolio';
import { useIsOnboardingCompleted } from '@/features/onboarding';
import { QueryProvider } from '@/shared/api';
import { HeaderButton, LaunchSplash, NativeStack, ToastHost } from '@/shared/ui';
import { goBackOrHome } from '@/shared/lib';

// Filters open over their list, which shows every change at once; closing is all that is left.
const FILTERS_MODAL = {
  presentation: 'modal',
  headerLeft: () => (
    <HeaderButton icon="close" accessibilityLabel="Закрити" onPress={goBackOrHome} />
  ),
} as const;

// LaunchSplash hides the native splash once it covers the screen; until then nothing shows through.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { theme, rt } = useUnistyles();
  const isOnboarded = useIsOnboardingCompleted();
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
            {/* The introduction comes first, once; then the first plan, then the app. */}
            <NativeStack.Protected guard={!isOnboarded} redirectTo={hasPlans ? '/' : '/welcome'}>
              <NativeStack.Screen name="onboarding" options={{ headerShown: false }} />
            </NativeStack.Protected>
            {/* Purchases live in plans, so the app opens only once there is one. */}
            <NativeStack.Protected
              guard={isOnboarded && hasPlans}
              redirectTo={isOnboarded ? '/welcome' : '/onboarding'}
            >
              {/* Each tab draws its own header in its own stack. */}
              <NativeStack.Screen name="(tabs)" options={{ headerShown: false }} />
              {/* Adding a purchase to the active plan: choose a bond, review it, then enter the purchase. */}
              <NativeStack.Screen name="add/index" options={{ title: 'Оберіть ОВДП' }} />
              <NativeStack.Screen name="add/[isin]/index" options={{ title: 'ОВДП' }} />
              <NativeStack.Screen
                name="add/[isin]/purchase"
                options={{ title: 'Додати купівлю' }}
              />
              <NativeStack.Screen name="plan/name" options={{ title: 'Новий план' }} />
              <NativeStack.Screen name="plan/list" options={{ title: 'Мої плани' }} />
              <NativeStack.Screen
                name="payment-filters"
                options={{ title: 'Фільтри виплат', ...FILTERS_MODAL }}
              />
              <NativeStack.Screen
                name="bond-filters"
                options={{ title: 'Фільтри ОВДП', ...FILTERS_MODAL }}
              />
              <NativeStack.Screen name="bond/[isin]" options={{ title: 'ОВДП' }} />
              <NativeStack.Screen name="reports/year" options={{ title: 'Звіт за рік' }} />
              <NativeStack.Screen name="reports/fx" options={{ title: 'Валютний еквівалент' }} />
              <NativeStack.Screen name="reports/period" options={{ title: 'Звіт за період' }} />
              <NativeStack.Screen
                name="report-filters/[report]"
                options={{ title: 'Фільтри звіту', ...FILTERS_MODAL }}
              />
              <NativeStack.Screen
                name="reports/year-over-year"
                options={{ title: 'Від року до року' }}
              />
              <NativeStack.Screen
                name="reports/redemptions"
                options={{ title: 'Графік погашень' }}
              />
              <NativeStack.Screen
                name="reports/portfolio"
                options={{ title: 'Звіт по портфелю' }}
              />
              <NativeStack.Screen
                name="reports/structure"
                options={{ title: 'Структура портфеля' }}
              />
              <NativeStack.Screen name="reports/yield" options={{ title: 'Річна дохідність' }} />
              <NativeStack.Screen name="reports/bond" options={{ title: 'Звіт по ОВДП' }} />
              <NativeStack.Screen name="backup/export" options={{ title: 'Створити копію' }} />
            </NativeStack.Protected>
            <NativeStack.Protected
              guard={isOnboarded && !hasPlans}
              redirectTo={isOnboarded ? '/' : '/onboarding'}
            >
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
