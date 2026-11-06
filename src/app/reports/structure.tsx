import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import PositionReportScreen from '@/screens/reports/position/PositionReportScreen';
export default function StructureReportRoute() {
  return (
    <DeferredScreen skeleton="list">
      <PositionReportScreen mode="structure" />
    </DeferredScreen>
  );
}
