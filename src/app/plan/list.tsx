import { PlanListScreen } from '@/pages/plan';

import { DeferredScreen } from '@/shared/ui';

export default function PlanListRoute() {
  return (
    <DeferredScreen skeleton="list">
      <PlanListScreen />
    </DeferredScreen>
  );
}
