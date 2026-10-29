import { AddPurchaseScreen } from '@/pages/holdings';
import { DeferredScreen } from '@/shared/ui';

export default function AddPurchaseRoute() {
  return (
    <DeferredScreen skeleton="form">
      <AddPurchaseScreen />
    </DeferredScreen>
  );
}
