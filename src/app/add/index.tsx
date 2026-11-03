import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import BondPickerScreen from '@/screens/holdings/BondPickerScreen';

export default function BondPickerRoute() {
  return (
    <DeferredScreen skeleton="list">
      <BondPickerScreen />
    </DeferredScreen>
  );
}
