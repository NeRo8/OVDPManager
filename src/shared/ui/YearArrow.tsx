import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Typography } from './typography/Typography';

type Props = {
  label: string;
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
};

export function YearArrow({ label, accessibilityLabel, disabled, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.arrow,
        disabled ? styles.disabled : pressed && styles.pressed,
      ]}
    >
      <Typography variant="title1" tone="accent" style={styles.arrowText}>
        {label}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  arrow: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.card,
  },
  disabled: { opacity: 0.3 },
  pressed: { opacity: 0.6 },
  arrowText: { lineHeight: 28 },
}));
