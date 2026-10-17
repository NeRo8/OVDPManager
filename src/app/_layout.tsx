import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';

import { HeaderButton } from '@/components/ui';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { goBackOrHome } from '@/lib/navigation';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="index" options={{ title: 'Мій ОВДП гаманець' }} />
        <Stack.Screen
          name="add"
          options={{
            title: 'Додати ОВДП',
            presentation: 'modal',
            headerLeft: () => <HeaderButton title="Скасувати" onPress={goBackOrHome} />,
          }}
        />
        <Stack.Screen name="bond/[isin]" options={{ title: 'ОВДП' }} />
        <Stack.Screen name="backup" options={{ title: 'Резервна копія' }} />
      </Stack>
    </ThemeProvider>
  );
}
