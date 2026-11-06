import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import RedemptionsReportScreen from '@/screens/reports/redemptions/RedemptionsReportScreen';

export default function RedemptionsReportRoute() {
  return (
    <DeferredScreen skeleton="list">
      <RedemptionsReportScreen />
    </DeferredScreen>
  );
}
