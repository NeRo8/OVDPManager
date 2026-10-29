import { BondScreen } from '@/pages/holdings';
import { DeferredScreen } from '@/shared/ui';

export default function BondRoute() {
  return (
    <DeferredScreen skeleton="list">
      <BondScreen />
    </DeferredScreen>
  );
}
