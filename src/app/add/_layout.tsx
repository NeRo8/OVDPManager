import { Stack } from 'expo-router';

import { goBackOrHome } from '@/shared/lib';
import { HeaderButton } from '@/shared/ui';

/** The add flow inside its modal: choose a bond, then enter the purchase. */
export default function AddLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Оберіть ОВДП',
          headerLeft: () => (
            <HeaderButton
              icon={{ ios: 'xmark', android: 'close' }}
              accessibilityLabel="Скасувати"
              onPress={goBackOrHome}
            />
          ),
        }}
      />
      <Stack.Screen name="[isin]" options={{ title: 'Додати ОВДП' }} />
    </Stack>
  );
}
