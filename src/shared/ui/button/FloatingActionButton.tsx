import { BottomTabBarHeightContext } from 'expo-router/js-tabs';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useContext } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { themeStyles, useColors } from '@/shared/theme';
import { Typography } from '../typography/Typography';

const SIZE = 56;
const MARGIN = 16;

/** Bottom padding a scrolling screen needs so the button never covers its last row. */
export const FAB_CLEARANCE = SIZE + MARGIN * 2;

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
}: {
  label?: string;
  accessibilityLabel: string;
  icon?: SymbolViewProps['name'];
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  const theme = themeStyles;
  const insets = useSafeAreaInsets();
  // Above a tab bar the safe area is already taken by the bar itself.
  const isAboveTabBar = useContext(BottomTabBarHeightContext) !== undefined;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.button,
        label ? styles.extended : styles.round,
        theme.accentBackground,
        {
          bottom: MARGIN + (isAboveTabBar ? 0 : insets.bottom),
          right: MARGIN + insets.right,
        },
        pressed && styles.pressed,
        style,
      ]}
    >
      <SymbolView name={icon} size={24} tintColor={colors.accentText} />
      {label && (
        <Typography variant="headline" tone="onAccent">
          {label}
        </Typography>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    height: SIZE,
    borderRadius: SIZE / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  },
  round: { width: SIZE },
  extended: { paddingLeft: 16, paddingRight: 20 },
  pressed: { opacity: 0.8 },
});
