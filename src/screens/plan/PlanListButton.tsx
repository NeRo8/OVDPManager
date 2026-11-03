import { router } from 'expo-router';

import { HeaderButton } from '@/components/button/HeaderButton';

/** Header action of the plans tab: all plans, to switch, add or pick the default one. */
export function PlanListButton() {
  const openPlanList = () => router.push('/plan/list');

  return <HeaderButton icon="list" accessibilityLabel="Мої плани" onPress={openPlanList} />;
}
