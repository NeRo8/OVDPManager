import { PlanNameScreen } from '@/pages/plan';

import { DeferredScreen } from '@/shared/ui';

export default function PlanNameRoute() {
  return (
    <DeferredScreen skeleton="form">
      <PlanNameScreen />
    </DeferredScreen>
  );
}
