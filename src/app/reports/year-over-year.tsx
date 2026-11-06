import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import CashFlowReportScreen from '@/screens/reports/cash-flow/CashFlowReportScreen';
export default function YearsReportRoute() {
  return (
    <DeferredScreen skeleton="list">
      <CashFlowReportScreen mode="year-over-year" />
    </DeferredScreen>
  );
}
