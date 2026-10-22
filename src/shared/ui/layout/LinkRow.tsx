import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ThemedSymbolView } from '../button/ThemedSymbolView';
import { Typography } from '../typography/Typography';

export type LinkRowProps = {
  title: string;
  subtitle?: string;
  onPress: () => void;
};

/** A section row that opens another screen. */
export function LinkRow({ title, subtitle, onPress }: LinkRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowText}>
        <Typography variant="body" tabular>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption1" tone="secondary">
            {subtitle}
          </Typography>
        )}
      </View>
      <ThemedSymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right' }}
        size={14}
        weight="semibold"
        uniProps={(theme) => ({ tintColor: theme.secondaryText })}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space.md,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
    minHeight: 48,
  },
  rowText: { flexShrink: 1, gap: theme.space.xxs },
  pressed: { backgroundColor: theme.muted },
}));
