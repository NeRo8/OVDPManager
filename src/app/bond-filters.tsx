import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import BondFiltersScreen from '@/screens/holdings/BondFiltersScreen';

export default function BondFiltersRoute() {
  return (
    <DeferredScreen skeleton="filters">
      <BondFiltersScreen />
    </DeferredScreen>
  );
}
