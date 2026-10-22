import BaseTopTabs, { type JSTopTabsProps } from 'expo-router/js-top-tabs';
import { useUnistyles } from 'react-native-unistyles';

import { typography } from '@/shared/theme';

type Props = JSTopTabsProps;

/**
 * Swipeable tabs under a screen's header, each tab its own route. The back action leaves the
 * screen instead of stepping through the tabs.
 */
function ThemedTopTabs(props: Props) {
  // Navigator options are props, not styles, so the theme is read here.
  const { theme } = useUnistyles();

  return (
    <BaseTopTabs
      backBehavior="none"
      {...props}
      screenOptions={{
        // Not lazy: expo-router keeps an unopened tab as a placeholder route keyed by its name, and
        // when the tab is opened the key changes. The pager then remounts that page and reports a
        // wrong index, so pressing a tab could land on another one. Without `lazy`, every tab
        // route is created right after the first render, before any tab is pressed.
        lazy: false,
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
