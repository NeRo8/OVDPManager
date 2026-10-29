import { StructureReportScreen } from '@/pages/reports';

import { DeferredScreen } from '@/shared/ui';

export default function StructureReportRoute() {
  return (
    <DeferredScreen skeleton="report">
      <StructureReportScreen />
    </DeferredScreen>
  );
}
