import { RedemptionsReportScreen } from '@/pages/reports';

import { DeferredScreen } from '@/shared/ui';

export default function RedemptionsReportRoute() {
  return (
    <DeferredScreen skeleton="report">
      <RedemptionsReportScreen />
    </DeferredScreen>
  );
}
