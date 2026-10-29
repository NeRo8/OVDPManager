import { PortfolioReportScreen } from '@/pages/reports';
import { DeferredScreen } from '@/shared/ui';

export default function PortfolioReportRoute() {
  return (
    <DeferredScreen skeleton="report">
      <PortfolioReportScreen />
    </DeferredScreen>
  );
}
