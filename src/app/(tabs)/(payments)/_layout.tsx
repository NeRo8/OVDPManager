import { PaymentFiltersButton } from '@/pages/payments';
import { NativeStack } from '@/shared/ui';

// Each tab has its own native stack, so its header is the platform's (glass on iOS 26).
export default function PaymentsStackLayout() {
  return (
    <NativeStack>
      <NativeStack.Screen
        name="(schedule)"
        options={{ title: 'Виплати', headerRight: () => <PaymentFiltersButton /> }}
      />
    </NativeStack>
  );
}
