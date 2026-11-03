import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import SaleScreen from '@/screens/holdings/SaleScreen';

export default function SaleRoute() {
  return (
    <DeferredScreen skeleton="form">
      <SaleScreen />
    </DeferredScreen>
  );
}
