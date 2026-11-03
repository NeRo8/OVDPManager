import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import PlanListScreen from '@/screens/plan/PlanListScreen';

export default function PlanListRoute() {
  return (
    <DeferredScreen skeleton="list">
      <PlanListScreen />
    </DeferredScreen>
  );
}
