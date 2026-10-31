import { type RedemptionTime, updateReportFilters } from '@/features/report-filters';

import { SegmentedSection } from '@/shared/ui';

import { REDEMPTION_TIME_LABELS } from '../lib/redemptionLabels';
import { useReport } from '../model/useReport.hook';

const TIME_OPTIONS = (['upcoming', 'past', 'all'] as const).map((value) => ({
  label: REDEMPTION_TIME_LABELS[value],
  value,
}));

/** Which redemptions the redemptions report covers: still ahead, received, or both. */
export function RedemptionTimeSection() {
  const { filters } = useReport('redemptions');

  const changeTime = (time: RedemptionTime) => updateReportFilters('redemptions', { time });

  return (
    <SegmentedSection
      title="Час"
      footer="Майбутні — погашення, яких ще не отримано; отримані — ті, що вже надійшли."
      options={TIME_OPTIONS}
      value={filters.time}
      onChange={changeTime}
    />
  );
}
