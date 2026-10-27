import { ThemedIcon } from '../icon/ThemedIcon';
import { ListRow } from './ListRow';

export type CheckRowProps = {
  title: string;
  subtitle?: string;
  checked: boolean;
  onPress: () => void;
};

/** A section row that is switched on and off, marked with a check. */
export function CheckRow({ title, subtitle, checked, onPress }: CheckRowProps) {
  return (
    <ListRow
      title={title}
      subtitle={subtitle}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      trailing={
        checked && (
          <ThemedIcon name="checkmark" size={20} uniProps={(theme) => ({ color: theme.accent })} />
        )
      }
    />
  );
}
