import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { BondSort } from '@/features/add-purchase';
import { ThemedIcon, Typography } from '@/shared/ui';

const SORT_LABELS: Record<BondSort, string> = {
  maturity: 'За погашенням',
  rate: 'За ставкою',
};

type SortToggleProps = {
  sort: BondSort;
  onChange: (sort: BondSort) => void;
};

/** Names the order in use; a press switches to the other one. */
export function SortToggle({ sort, onChange }: SortToggleProps) {
  return (
    <Pressable
      onPress={() => onChange(sort === 'maturity' ? 'rate' : 'maturity')}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Сортування: ${SORT_LABELS[sort].toLowerCase()}. Змінити`}
      style={({ pressed }) => [styles.sort, pressed && styles.sortPressed]}
    >
      <ThemedIcon name="swap-vertical" size={14} uniProps={(theme) => ({ color: theme.accent })} />
      <Typography variant="footnote" weight="semibold" tone="accent">
        {SORT_LABELS[sort]}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  sort: { flexDirection: 'row', alignItems: 'center', gap: theme.space.xs },
  sortPressed: { opacity: 0.6 },
}));
