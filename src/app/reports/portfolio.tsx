import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import PortfolioReportScreen from '@/screens/reports/portfolio/PortfolioReportScreen';

export default function PortfolioReportRoute() {
  return (
    <DeferredScreen skeleton="list">
      <PortfolioReportScreen />
    </DeferredScreen>
  );
}
