import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import CashFlowReportScreen from '@/screens/reports/cash-flow/CashFlowReportScreen';
export default function PeriodReportRoute() {
  return (
    <DeferredScreen skeleton="list">
      <CashFlowReportScreen mode="period" />
    </DeferredScreen>
  );
}
