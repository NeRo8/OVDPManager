import { Stack } from 'expo-router';
import type { ComponentProps } from 'react';
import { useUnistyles } from 'react-native-unistyles';

import { hasLiquidGlass } from '@/shared/lib';

type Props = Omit<ComponentProps<typeof Stack>, 'screenOptions'>;

/**
 * A native stack with the app's headers. With Liquid Glass the header is transparent: the content
 * scrolls under it and its buttons sit on glass. Elsewhere it is a solid bar in the screen color.
 */
function ThemedStack(props: Props) {
  // Navigator options are props, not styles, so the theme is read here.
  const { theme } = useUnistyles();

  return (
    <Stack
      {...props}
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerTransparent: hasLiquidGlass,
        headerShadowVisible: false,
        headerStyle: hasLiquidGlass ? undefined : { backgroundColor: theme.background },
        headerTintColor: theme.accent,
        headerTitleStyle: { color: theme.text },
        contentStyle: { backgroundColor: theme.background },
      }}
    />
  );
}

export const NativeStack = Object.assign(ThemedStack, {
  Screen: Stack.Screen,
  Protected: Stack.Protected,
});
