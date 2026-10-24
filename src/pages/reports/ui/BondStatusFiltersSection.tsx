import { type PortfolioStatus, updateReportFilters } from '@/features/report-filters';
import { useReport } from '../model/useReport.hook';
import { BondStatusSection } from './BondStatusSection';

type Props = {
  report: 'portfolio' | 'yield';
};

/** Which bonds the portfolio or yield report covers by where they stand. */
export function BondStatusFiltersSection({ report }: Props) {
  const { filters } = useReport(report);

  const changeStatus = (status: PortfolioStatus) => updateReportFilters(report, { status });

  return <BondStatusSection value={filters.status} onChange={changeStatus} />;
}
