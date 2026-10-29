import { PaymentFiltersScreen } from '@/pages/payments';

import { DeferredScreen } from '@/shared/ui';

export default function PaymentFiltersRoute() {
  return (
    <DeferredScreen skeleton="filters">
      <PaymentFiltersScreen />
    </DeferredScreen>
  );
}
