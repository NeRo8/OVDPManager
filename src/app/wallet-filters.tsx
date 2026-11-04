import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import WalletFiltersScreen from '@/screens/holdings/WalletFiltersScreen';

export default function WalletFiltersRoute() {
  return (
    <DeferredScreen skeleton="filters">
      <WalletFiltersScreen />
    </DeferredScreen>
  );
}
