import { NativeStack } from '@/components/navigation/NativeStack';
import { WalletFiltersButton } from '@/screens/holdings/WalletFiltersButton';

export default function HoldingsStackLayout() {
  return (
    <NativeStack>
      <NativeStack.Screen
        name="holdings"
        options={{ title: 'Гаманець', headerRight: () => <WalletFiltersButton /> }}
      />
    </NativeStack>
  );
}
