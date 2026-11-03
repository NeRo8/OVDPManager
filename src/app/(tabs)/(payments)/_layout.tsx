import { NativeStack } from '@/components/navigation/NativeStack';
import { PaymentFiltersButton } from '@/screens/payments/PaymentFiltersButton';

// Each tab has its own native stack, so its header is the platform's (glass on iOS 26).
export default function PaymentsStackLayout() {
  return (
    <NativeStack>
      <NativeStack.Screen
        name="index"
        options={{ title: 'Виплати', headerRight: () => <PaymentFiltersButton /> }}
      />
    </NativeStack>
  );
}
