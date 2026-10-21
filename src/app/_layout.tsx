import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';

import { HeaderButton } from '@/shared/ui';
import { goBackOrHome } from '@/shared/lib';

export default function RootLayout() {
  const { rt } = useUnistyles();

  return (
    <ThemeProvider value={rt.themeName === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add"
          options={{
            title: 'Додати ОВДП',
            presentation: 'modal',
            headerLeft: () => (
              <HeaderButton
                icon={{ ios: 'xmark', android: 'close' }}
                accessibilityLabel="Скасувати"
                onPress={goBackOrHome}
              />
            ),
          }}
        />
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
        <Stack.Screen name="backup/export" options={{ title: 'Створити копію' }} />
        <Stack.Screen name="backup/import" options={{ title: 'Відновити з копії' }} />
        <Stack.Screen name="backup/mock" options={{ title: 'Мок для розробки' }} />
      </Stack>
    </ThemeProvider>
  );
}
