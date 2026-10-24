import { View } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';

import { IconBadgeArt } from './IconBadgeArt';
import { type IconName, ThemedIcon } from './ThemedIcon';

export type IconBadgeSize = 'md' | 'lg';

const SIZES = {
  md: { canvas: 128, glyph: 40 },
  lg: { canvas: 152, glyph: 48 },
} as const satisfies Record<IconBadgeSize, { canvas: number; glyph: number }>;

// Skia takes colors as props, so the theme reaches the drawing through withUnistyles.
const ThemedIconBadgeArt = withUnistyles(IconBadgeArt);

type Props = {
  icon: IconName;
  size?: IconBadgeSize;
};

/**
 * An illustration icon: an accent glyph on a lit disc, in a breathing glow with a comet on its
 * orbit (Skia). It only decorates the text next to it, so screen readers skip it.
 */
export function IconBadge({ icon, size = 'md' }: Props) {
  const { canvas, glyph } = SIZES[size];
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <ThemedIconBadgeArt
        size={canvas}
        uniProps={(theme) => ({
          accent: theme.accent,
          surface: theme.accentSurface,
          card: theme.card,
        })}
      />
      <View style={styles.glyph}>
        <ThemedIcon name={icon} size={glyph} uniProps={(theme) => ({ color: theme.accent })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glyph: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
