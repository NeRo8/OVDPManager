import { router } from 'expo-router';

import { HeaderButton } from '@/shared/ui';

/** Header action of the plans tab: all plans, to switch, add or pick the default one. */
export function PlanListButton() {
  return (
    <HeaderButton
      icon="list"
      accessibilityLabel="Мої плани"
      onPress={() => router.push('/plan/list')}
    />
  );
}
