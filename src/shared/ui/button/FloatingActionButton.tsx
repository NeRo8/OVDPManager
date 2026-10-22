import { BottomTabBarHeightContext } from 'expo-router/js-tabs';
import type { SymbolViewProps } from 'expo-symbols';
import { use } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '../typography/Typography';
import { ThemedSymbolView } from './ThemedSymbolView';

const SIZE = 56;
const MARGIN = 16;

/** Bottom padding a scrolling screen needs so the button never covers its last row. */
export const FAB_CLEARANCE = SIZE + MARGIN * 2;

export type FloatingActionButtonProps = {
  label?: string;
  accessibilityLabel: string;
  icon?: SymbolViewProps['name'];
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * The screen's primary action (create, edit) pinned to the bottom-right corner. With a `label` it
 * becomes the extended pill. Render it after the screen's list, inside a container that fills
 * the screen.
 */
export function FloatingActionButton({
  label,
  accessibilityLabel,
  icon = { ios: 'plus', android: 'add' },
  onPress,
  style,
}: FloatingActionButtonProps) {
  // Above a tab bar the safe area is already taken by the bar itself.
  const isAboveTabBar = use(BottomTabBarHeightContext) !== undefined;
  styles.useVariants({ aboveTabBar: isAboveTabBar, extended: !!label });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
    >
      <ThemedSymbolView
        name={icon}
        size={24}
        uniProps={(theme) => ({ tintColor: theme.accentText })}
      />
      {label && (
        <Typography variant="headline" tone="onAccent">
          {label}
        </Typography>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  button: {
    position: 'absolute',
    right: MARGIN + rt.insets.right,
    height: SIZE,
    borderRadius: SIZE / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.accent,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    variants: {
      aboveTabBar: {
        true: { bottom: MARGIN },
        false: { bottom: MARGIN + rt.insets.bottom },
      },
      extended: {
        true: { paddingLeft: 16, paddingRight: 20 },
        false: { width: SIZE },
      },
    },
  },
  pressed: { opacity: 0.8 },
}));
