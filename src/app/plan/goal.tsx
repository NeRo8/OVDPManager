import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import CouponGoalScreen from '@/screens/plan/CouponGoalScreen';

export default function CouponGoalRoute() {
  return (
    <DeferredScreen skeleton="form">
      <CouponGoalScreen />
    </DeferredScreen>
  );
}
