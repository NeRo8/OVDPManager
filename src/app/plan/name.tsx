import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import PlanNameScreen from '@/screens/plan/PlanNameScreen';

export default function PlanNameRoute() {
  return (
    <DeferredScreen skeleton="form">
      <PlanNameScreen />
    </DeferredScreen>
  );
}
