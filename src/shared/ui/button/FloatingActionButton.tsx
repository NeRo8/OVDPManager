import { BottomTabBarHeightContext } from 'expo-router/js-tabs';
import { use } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { space } from '@/shared/theme';
import { Typography } from '../typography/Typography';
import { type IconName, ThemedIcon } from '../icon/ThemedIcon';

const SIZE = 56;
const MARGIN = space.lg;

/** Bottom padding a scrolling screen needs so the button never covers its last row. */
export const FAB_CLEARANCE = SIZE + MARGIN * 2;

export type FloatingActionButtonProps = {
  label?: string;
  accessibilityLabel: string;
  icon?: IconName;
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
  icon = 'add',
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
      <ThemedIcon name={icon} size={28} uniProps={(theme) => ({ color: theme.fabIcon })} />
      {label && (
        <Typography variant="headline" style={styles.label}>
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
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.sm,
    backgroundColor: theme.fab,
    boxShadow: theme.shadowRaised,
    variants: {
      aboveTabBar: {
        true: { bottom: MARGIN },
        false: { bottom: MARGIN + rt.insets.bottom },
      },
      extended: {
        // The extra right padding balances the glyph's optical weight on the left.
        true: { paddingLeft: theme.space.lg, paddingRight: theme.space.lg + theme.space.xs },
        false: { width: SIZE },
      },
    },
  },
  label: { color: theme.fabText },
  pressed: { opacity: 0.8 },
}));
