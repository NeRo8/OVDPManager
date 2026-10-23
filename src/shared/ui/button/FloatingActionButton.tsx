import { GlassView } from 'expo-glass-effect';
import { Pressable, type StyleProp, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-screens/experimental';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';

import { hasLiquidGlass } from '@/shared/lib';
import { space } from '@/shared/theme';
import { Typography } from '../typography/Typography';
import { type IconName, ThemedIcon } from '../icon/ThemedIcon';

const SIZE = 56;
const MARGIN = space.lg;

/** Bottom padding a scrolling screen needs so the button never covers its last row. */
export const FAB_CLEARANCE = SIZE + MARGIN * 2;

// The glass follows the app's theme, which may differ from the system one; the tint is the button color.
const FabGlass = withUnistyles(GlassView, (theme, rt) => ({
  colorScheme: rt.themeName,
  tintColor: theme.fab,
}));

export type FloatingActionButtonProps = {
  label?: string;
  accessibilityLabel: string;
  icon?: IconName;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * The screen's primary action (create, edit) pinned to the bottom-right corner, on tinted glass
 * where Liquid Glass is drawn. With a `label` it becomes the extended pill. Render it after the
 * screen's list, inside a container that fills the screen.
 */
export function FloatingActionButton({
  label,
  accessibilityLabel,
  icon = 'add',
  onPress,
  style,
}: FloatingActionButtonProps) {
  styles.useVariants({ extended: !!label });

  const content = (
    <>
      <ThemedIcon name={icon} size={28} uniProps={(theme) => ({ color: theme.fabIcon })} />
      {label && (
        <Typography variant="headline" style={styles.label}>
          {label}
        </Typography>
      )}
    </>
  );

  return (
    // The screen's own safe area: above the tab bar in a tab, above the home indicator elsewhere.
    // Android's tab content already ends above the tab bar, which would count again as an
    // interface inset; the system bars alone are what is left to clear there.
    <SafeAreaView
      edges={{ bottom: true, right: true }}
      insetType="system"
      style={styles.area}
      pointerEvents="box-none"
    >
      <View style={styles.corner} pointerEvents="box-none">
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          // Interactive glass answers the touch itself.
          style={({ pressed }) => [!hasLiquidGlass && pressed && styles.pressed, style]}
        >
          {hasLiquidGlass ? (
            <FabGlass isInteractive style={styles.button}>
              {content}
            </FabGlass>
          ) : (
            <View style={[styles.button, styles.solid]}>{content}</View>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  area: { ...StyleSheet.absoluteFillObject },
  corner: { flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end', padding: MARGIN },
  button: {
    height: SIZE,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.sm,
    variants: {
      extended: {
        // The extra right padding balances the glyph's optical weight on the left.
        true: { paddingLeft: theme.space.lg, paddingRight: theme.space.lg + theme.space.xs },
        false: { width: SIZE },
      },
    },
  },
  solid: { backgroundColor: theme.fab, boxShadow: theme.shadowRaised },
  label: { color: theme.fabText },
  pressed: { opacity: 0.8 },
}));
