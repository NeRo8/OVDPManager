import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import BondScreen from '@/screens/holdings/BondScreen';

export default function BondRoute() {
  return (
    <DeferredScreen skeleton="list">
      <BondScreen />
    </DeferredScreen>
  );
}
