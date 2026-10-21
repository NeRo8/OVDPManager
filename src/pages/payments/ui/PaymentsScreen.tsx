import { useState } from 'react';

import { WalletGate } from '@/entities/portfolio';
import { SegmentedSelect } from '@/shared/ui';
import { useFilteredWallet } from '../model/useFilteredWallet.hook';
import { UpcomingPaymentsList } from './UpcomingPaymentsList';
import { YearScheduleList } from './YearScheduleList';

type PaymentsMode = 'upcoming' | 'year';

const MODE_OPTIONS: { label: string; value: PaymentsMode }[] = [
  { label: 'Майбутні', value: 'upcoming' },
  { label: 'За рік', value: 'year' },
];

/** The payments tab: what is still ahead, or a whole year with its chart. Filters apply to both. */
export default function PaymentsScreen() {
  const filtered = useFilteredWallet();
  const [mode, setMode] = useState<PaymentsMode>('upcoming');
  const modeSwitch = <SegmentedSelect options={MODE_OPTIONS} value={mode} onChange={setMode} />;

  return (
    <WalletGate wallet={filtered.wallet}>
      {mode === 'upcoming' ? (
        <UpcomingPaymentsList filtered={filtered} header={modeSwitch} />
      ) : (
        <YearScheduleList filtered={filtered} header={modeSwitch} />
      )}
    </WalletGate>
  );
}
