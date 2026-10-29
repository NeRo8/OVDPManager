import { AddBondDetailsScreen } from '@/pages/holdings';
import { DeferredScreen } from '@/shared/ui';

export default function AddBondDetailsRoute() {
  return (
    <DeferredScreen skeleton="list">
      <AddBondDetailsScreen />
    </DeferredScreen>
  );
}
