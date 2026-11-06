import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import PositionReportScreen from '@/screens/reports/position/PositionReportScreen';
export default function YieldReportRoute() {
  return (
    <DeferredScreen skeleton="list">
      <PositionReportScreen mode="yield" />
    </DeferredScreen>
  );
}
