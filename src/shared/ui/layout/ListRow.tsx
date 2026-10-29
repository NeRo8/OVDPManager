import type { ReactNode } from 'react';
import {
  type AccessibilityRole,
  type AccessibilityState,
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '../typography/Typography';

export type ListRowProps = {
  /** Before the content, such as an Avatar */
  leading?: ReactNode;
  /** The first line; a string is set as the row's title text */
  title?: ReactNode;
  /** The secondary line under the title */
  subtitle?: ReactNode;
  /** Content of its own, under the title or in its place */
  children?: ReactNode;
  /** After the content, such as an amount, a check or a chevron */
  trailing?: ReactNode;
  /** Makes the whole row pressable, darkening it while pressed */
  onPress?: () => void;
  disabled?: boolean;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityState?: AccessibilityState;
  style?: StyleProp<ViewStyle>;
};

/**
 * A row of a section card or a list: what leads it, its text, what ends it. Every list row of the
 * app is one, so they share padding, height and the pressed state.
 */
export function ListRow({
  leading,
  title,
  subtitle,
  children,
  trailing,
  onPress,
  disabled,
  accessibilityRole,
  accessibilityLabel,
  accessibilityState,
  style,
}: ListRowProps) {
  const content = (
    <>
      {leading}
      <View style={styles.content}>
        {typeof title === 'string' ? (
          <Typography variant="body" tabular>
            {title}
          </Typography>
        ) : (
          title
        )}
        {typeof subtitle === 'string' ? (
          <Typography variant="caption1" tone="secondary">
            {subtitle}
          </Typography>
        ) : (
          subtitle
        )}
        {children}
      </View>
      {trailing}
    </>
  );

  if (!onPress) {
    return (
      <View
        style={[styles.row, style]}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, ...accessibilityState }}
      style={({ pressed }) => [
        styles.row,
        disabled ? styles.disabled : pressed && styles.pressed,
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
    minHeight: 48,
  },
  content: { flex: 1, gap: theme.space.xxs },
  pressed: { backgroundColor: theme.muted },
  disabled: { opacity: 0.4 },
}));
