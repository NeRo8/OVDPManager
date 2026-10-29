import { ReportFiltersScreen } from '@/pages/reports';

import { DeferredScreen } from '@/shared/ui';

export default function ReportFiltersRoute() {
  return (
    <DeferredScreen skeleton="filters">
      <ReportFiltersScreen />
    </DeferredScreen>
  );
}
