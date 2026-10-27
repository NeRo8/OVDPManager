import { Stack } from 'expo-router';

import { HeaderButton } from '../button/HeaderButton';

type Props = {
  /** Filters that differ from the defaults; with none, there is nothing to reset */
  activeFilterCount: number;
  onReset: () => void;
};

/** The header of a filters screen: its one action, at the right, puts every filter back. */
export function ResetFiltersHeader({ activeFilterCount, onReset }: Props) {
  return (
    <Stack.Screen
      options={{
        headerRight: () => (
          <HeaderButton
            icon="refresh"
            accessibilityLabel="Скинути фільтри"
            onPress={onReset}
            disabled={activeFilterCount === 0}
          />
        ),
      }}
    />
  );
}
