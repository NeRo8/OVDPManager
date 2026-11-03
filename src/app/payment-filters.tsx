import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import PaymentFiltersScreen from '@/screens/payments/PaymentFiltersScreen';

export default function PaymentFiltersRoute() {
  return (
    <DeferredScreen skeleton="filters">
      <PaymentFiltersScreen />
    </DeferredScreen>
  );
}
