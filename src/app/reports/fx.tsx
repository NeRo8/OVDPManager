import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import FxReportScreen from '@/screens/reports/fx/FxReportScreen';

export default function FxReportRoute() {
  return (
    <DeferredScreen skeleton="list">
      <FxReportScreen />
    </DeferredScreen>
  );
}
