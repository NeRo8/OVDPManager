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
        <Stack.Screen name="bond/[isin]" options={{ title: 'ОВДП' }} />
        <Stack.Screen name="backup/import" options={{ title: 'Відновити з копії' }} />
      </Stack>
    </ThemeProvider>
  );
}
