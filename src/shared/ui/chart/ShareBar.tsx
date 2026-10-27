import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '../typography/Typography';

export type ShareBarProps = {
  /** 0–100 */
  percent: number;
  accessibilityLabel: string;
  /** Says the share in words under the bar, such as «12 % вкладень» */
  caption?: string;
};

/** A thin bar filled to a share of the whole, with what it means under it when captioned. */
export function ShareBar({ percent, accessibilityLabel, caption }: ShareBarProps) {
  const bar = (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={styles.track}
    >
      <View style={[styles.fill, { width: `${percent}%` }]} />
    </View>
  );
  if (!caption) return bar;

  return (
    <View style={styles.captioned}>
      {bar}
      <Typography variant="caption1" tone="secondary" tabular>
        {caption}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  captioned: { gap: theme.space.xs, marginTop: theme.space.xxs },
  track: {
    height: 4,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
    backgroundColor: theme.border,
  },
  fill: { height: '100%', borderRadius: theme.radius.full, backgroundColor: theme.accent },
}));
