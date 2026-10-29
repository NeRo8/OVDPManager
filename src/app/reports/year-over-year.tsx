import { YearOverYearReportScreen } from '@/pages/reports';

import { DeferredScreen } from '@/shared/ui';

export default function YearOverYearReportRoute() {
  return (
    <DeferredScreen skeleton="report">
      <YearOverYearReportScreen />
    </DeferredScreen>
  );
}
