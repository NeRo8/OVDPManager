import { YieldReportScreen } from '@/pages/reports';

import { DeferredScreen } from '@/shared/ui';

export default function YieldReportRoute() {
  return (
    <DeferredScreen skeleton="report">
      <YieldReportScreen />
    </DeferredScreen>
  );
}
