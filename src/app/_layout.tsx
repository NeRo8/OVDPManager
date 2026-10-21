import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';

import { HeaderButton } from '@/shared/ui';
import { goBackOrHome } from '@/shared/lib';

export default function RootLayout() {
  const { theme, rt } = useUnistyles();
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* The add flow has its own stack and headers: bond list, then the purchase form. */}
        <Stack.Screen name="add" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen
          name="payment-filters"
          options={{
            title: 'Фільтри виплат',
            presentation: 'modal',
            headerLeft: () => (
              <HeaderButton
                icon={{ ios: 'xmark', android: 'close' }}
                accessibilityLabel="Закрити"
                onPress={goBackOrHome}
              />
            ),
          }}
        />
        <Stack.Screen
          name="bond/[isin]"
          // The top tabs continue the header: an opaque one in the same color, so the tab bar is
          // not drawn under it (iOS 26 headers are transparent), and the line goes under the tabs.
          options={{
            title: 'ОВДП',
            headerTransparent: false,
            headerStyle: { backgroundColor: theme.card },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen name="backup/import" options={{ title: 'Відновити з копії' }} />
      </Stack>
    </ThemeProvider>
  );
}
