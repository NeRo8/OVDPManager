import { BondFiltersScreen } from '@/pages/holdings';
import { DeferredScreen } from '@/shared/ui';

export default function BondFiltersRoute() {
  return (
    <DeferredScreen skeleton="filters">
      <BondFiltersScreen />
    </DeferredScreen>
  );
}
