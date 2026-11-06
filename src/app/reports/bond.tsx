import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import PositionReportScreen from '@/screens/reports/position/PositionReportScreen';
export default function BondReportRoute() {
  return (
    <DeferredScreen skeleton="list">
      <PositionReportScreen mode="bond" />
    </DeferredScreen>
  );
}
