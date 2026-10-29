import { ThemedIcon } from '../icon/ThemedIcon';

import { ListRow } from './ListRow';

export type LinkRowProps = {
  title: string;
  subtitle?: string;
  onPress: () => void;
};

/** A section row that opens another screen. */
export function LinkRow({ title, subtitle, onPress }: LinkRowProps) {
  return (
    <ListRow
      title={title}
      subtitle={subtitle}
      onPress={onPress}
      accessibilityRole="link"
      trailing={
        <ThemedIcon
          name="chevron-forward"
          size={16}
          uniProps={(theme) => ({ color: theme.secondaryText })}
        />
      }
    />
  );
}
