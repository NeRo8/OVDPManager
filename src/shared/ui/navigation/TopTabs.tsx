import BaseTopTabs, { type JSTopTabsProps } from 'expo-router/js-top-tabs';
import { useUnistyles } from 'react-native-unistyles';

import { typography } from '@/shared/theme';

/**
 * Swipeable tabs under a screen's header, each tab its own route. A tab renders the first time it
 * is opened, and the back action leaves the screen instead of stepping through the tabs.
 */
function ThemedTopTabs(props: JSTopTabsProps) {
  // Navigator options are props, not styles, so the theme is read here.
  const { theme } = useUnistyles();

  return (
    <BaseTopTabs
      backBehavior="none"
      {...props}
      screenOptions={{
        lazy: true,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.secondaryText,
        tabBarIndicatorStyle: { backgroundColor: theme.accent, height: 2 },
        tabBarStyle: {
          backgroundColor: theme.card,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.border,
        },
        tabBarLabelStyle: { ...typography.subhead, fontWeight: '600', textTransform: 'none' },
        sceneStyle: { backgroundColor: theme.background },
      }}
    />
  );
}

export const TopTabs = Object.assign(ThemedTopTabs, { Screen: BaseTopTabs.Screen });
