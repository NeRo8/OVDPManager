import { DarkTheme, DefaultTheme, type Href, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useUnistyles } from 'react-native-unistyles';

import { QueryProvider } from '@/api/QueryProvider';
import { HeaderButton } from '@/components/button/HeaderButton';
import { NativeStack } from '@/components/navigation/NativeStack';
import { LaunchSplash } from '@/components/splash/LaunchSplash';
import { ToastHost } from '@/components/toast/ToastHost';
import { purchaseScreenTitle } from '@/screens/holdings/purchaseScreenTitle';
import { planNameTitle } from '@/screens/plan/planNameTitle';
import { useToday, useIsOnboardingCompleted } from '@/stores/appSettings';
import { getActiveOperations, useInvestmentPlans } from '@/stores/plans';
import { goBackOr } from '@/utils/navigation';

// Filters open over their list, which shows every change at once; closing is all that is left.
const filtersModal = (fallback: Href) =>
  ({
    presentation: 'modal',
    headerLeft: () => (
      <HeaderButton icon="close" accessibilityLabel="Закрити" onPress={() => goBackOr(fallback)} />
    ),
  }) as const;

// LaunchSplash hides the native splash once it covers the screen; until then nothing shows through.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { theme, rt } = useUnistyles();
  const isOnboarded = useIsOnboardingCompleted();
  const hasPlans = useInvestmentPlans().length > 0;
  const today = useToday();
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
    <GestureHandlerRootView style={{ flex: 1 }}>
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
                <NativeStack.Screen
                  name="add/[isin]/index"
                  options={({ route }) => ({
                    title: (route.params as { isin?: string })?.isin ?? 'ОВДП',
                  })}
                />
                <NativeStack.Screen
                  name="add/[isin]/purchase"
                  options={({ route }) => {
                    const { isin, purchaseId } = (route.params ?? {}) as {
                      isin?: string;
                      purchaseId?: string;
                    };
                    // Read when the screen is pushed; the screen keeps its title current itself.
                    return {
                      title: purchaseScreenTitle(getActiveOperations(), isin, purchaseId, today),
                    };
                  }}
                />
                <NativeStack.Screen
                  name="plan/name"
                  options={({ route }) => ({
                    title: planNameTitle((route.params as { planId?: string })?.planId, false),
                  })}
                />
                <NativeStack.Screen name="plan/list" options={{ title: 'Мої плани' }} />
                <NativeStack.Screen name="intro" options={{ headerShown: false }} />
                {/* A plan's actions; a swipe down or a tap outside closes the sheet. */}
                <NativeStack.Screen
                  name="plan/actions"
                  options={{
                    presentation: 'formSheet',
                    sheetAllowedDetents: 'fitToContents',
                    sheetGrabberVisible: true,
                    headerShown: false,
                  }}
                />
                <NativeStack.Screen
                  name="payment-filters"
                  options={{ title: 'Фільтри виплат', ...filtersModal('/') }}
                />
                <NativeStack.Screen
                  name="bond-filters"
                  options={{ title: 'Фільтри ОВДП', ...filtersModal('/add') }}
                />
                <NativeStack.Screen
                  name="bond/[isin]/index"
                  options={({ route }) => ({
                    title: (route.params as { isin?: string })?.isin ?? 'ОВДП',
                  })}
                />
                <NativeStack.Screen name="bond/[isin]/sale" options={{ title: 'Продаж' }} />
                <NativeStack.Screen name="backup/export" options={{ title: 'Створити копію' }} />
              </NativeStack.Protected>
              <NativeStack.Protected
                guard={isOnboarded && !hasPlans}
                redirectTo={isOnboarded ? '/holdings' : '/onboarding'}
              >
                <NativeStack.Screen
                  name="welcome"
                  options={{ title: planNameTitle(undefined, true) }}
                />
              </NativeStack.Protected>
              {/* Reachable without plans too: a backup brings its plans along. */}
              <NativeStack.Screen name="backup/import" options={{ title: 'Відновити з копії' }} />
            </NativeStack>
            <ToastHost />
            <LaunchSplash />
          </ThemeProvider>
        </QueryProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
