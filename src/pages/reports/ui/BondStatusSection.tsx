import type { PortfolioStatus } from '@/features/report-filters';

import { SegmentedSection } from '@/shared/ui';

import { PORTFOLIO_STATUS_LABELS } from '../lib/portfolioLabels';

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
      footer="В обігу — ОВДП до дати погашення включно, заплановані купівлі та ОВДП без даних НБУ. Погашені — ОВДП, дата погашення яких минула."
      options={STATUS_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
