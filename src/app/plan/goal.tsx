import { CouponGoalScreen } from '@/pages/plan';

import { DeferredScreen } from '@/shared/ui';

export default function CouponGoalRoute() {
  return (
    <DeferredScreen skeleton="form">
      <CouponGoalScreen />
    </DeferredScreen>
  );
}
