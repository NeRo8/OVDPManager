import { BondPickerScreen } from '@/pages/holdings';

import { DeferredScreen } from '@/shared/ui';

export default function BondPickerRoute() {
  return (
    <DeferredScreen skeleton="list">
      <BondPickerScreen />
    </DeferredScreen>
  );
}
