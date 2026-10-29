import type { ReportName } from '@/features/report-filters';

import { BondChoiceSection } from './BondChoiceSection';
import { BondStatusFiltersSection } from './BondStatusFiltersSection';
import { FxFiltersSection } from './FxFiltersSection';
import { PeriodFiltersSection } from './PeriodFiltersSection';
import { RedemptionTimeSection } from './RedemptionTimeSection';
import { StructurePurchasesSection } from './StructurePurchasesSection';
import { YearFiltersSection } from './YearFiltersSection';

type Props = {
  report: ReportName;
};

/** The filters a report has besides its currency and bonds, if any. */
export function ReportOwnFiltersSection({ report }: Props) {
  switch (report) {
    case 'year':
      return <YearFiltersSection report="year" />;
    case 'fx':
      return <FxFiltersSection />;
    case 'period':
      return <PeriodFiltersSection />;
    case 'redemptions':
      return <RedemptionTimeSection />;
    case 'portfolio':
    case 'yield':
      return <BondStatusFiltersSection report={report} />;
    case 'structure':
      return <StructurePurchasesSection />;
    case 'bond':
      return <BondChoiceSection />;
    case 'yearOverYear':
      return null;
  }
}
