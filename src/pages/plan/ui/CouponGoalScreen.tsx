import { router } from 'expo-router';

import { BondsGate, useActivePlan } from '@/entities/portfolio';

import { CouponGoalForm } from './CouponGoalForm';

/**
 * «Ціль: купони на місяць» for the active plan. It picks bonds from the NBU catalog, so it opens
 * once the catalog is there; once the «План з ціллю» is created, the plans tab shows it.
 */
export default function CouponGoalScreen() {
  const plan = useActivePlan();
  const showPlan = () => router.back();

  // The app's screens open only once there is a plan, so one is always active here.
  if (!plan) return null;

  return (
    <BondsGate>
      <CouponGoalForm planName={plan.name} onCreated={showPlan} />
    </BondsGate>
  );
}
