import type { PortfolioStatus } from '@/features/report-filters';
import { SegmentedSection } from '@/shared/ui';
import { PORTFOLIO_STATUS_LABELS } from './portfolioLabels';

type Props = {
  value: PortfolioStatus;
  onChange: (status: PortfolioStatus) => void;
};

const STATUS_OPTIONS = (['all', 'inCirculation', 'redeemed'] as const).map((value) => ({
  label: PORTFOLIO_STATUS_LABELS[value],
  value,
}));

/** Which bonds a report covers by where they stand, in its filters screen. */
export function BondStatusSection({ value, onChange }: Props) {
  return (
    <SegmentedSection
      title="Стан"
      footer="В обігу — ОВДП, за якими ще будуть виплати, і заплановані купівлі; погашені — ті, за якими всі виплати вже отримано."
      options={STATUS_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
