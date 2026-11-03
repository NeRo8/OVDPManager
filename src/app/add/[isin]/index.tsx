import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import AddBondDetailsScreen from '@/screens/holdings/AddBondDetailsScreen';

export default function AddBondDetailsRoute() {
  return (
    <DeferredScreen skeleton="list">
      <AddBondDetailsScreen />
    </DeferredScreen>
  );
}
