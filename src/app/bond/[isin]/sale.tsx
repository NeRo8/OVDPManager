import { SaleScreen } from '@/pages/holdings';

import { DeferredScreen } from '@/shared/ui';

export default function SaleRoute() {
  return (
    <DeferredScreen skeleton="form">
      <SaleScreen />
    </DeferredScreen>
  );
}
