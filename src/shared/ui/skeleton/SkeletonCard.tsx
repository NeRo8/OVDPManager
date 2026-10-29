import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Card } from '../layout/Card';
import { SkeletonBlock } from './SkeletonBlock';

/** A `Card` with a headline figure on its way: a caption, the figure and a line under it. */
export function SkeletonCard() {
  return (
    <Card>
      <View style={styles.lines}>
        <SkeletonBlock width="40%" height={12} />
        <SkeletonBlock width="65%" height={28} />
        <SkeletonBlock width="85%" height={12} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  lines: { gap: theme.space.sm },
}));
