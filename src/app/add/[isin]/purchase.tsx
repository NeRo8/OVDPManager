import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import AddPurchaseScreen from '@/screens/holdings/AddPurchaseScreen';

export default function AddPurchaseRoute() {
  return (
    <DeferredScreen skeleton="form">
      <AddPurchaseScreen />
    </DeferredScreen>
  );
}
