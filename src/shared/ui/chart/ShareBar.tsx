import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export type ShareBarProps = {
  /** 0–100 */
  percent: number;
  accessibilityLabel: string;
};

/** A thin bar filled to a share of the whole. */
export function ShareBar({ percent, accessibilityLabel }: ShareBarProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={styles.track}
    >
      <View style={[styles.fill, { width: `${percent}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  track: {
    height: 4,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
    backgroundColor: theme.border,
  },
  fill: { height: '100%', borderRadius: theme.radius.full, backgroundColor: theme.accent },
}));
