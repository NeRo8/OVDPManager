import {
  chooseReportPeriod,
  resetReportFilters,
  updateReportFilters,
} from '../reportFilters/actions';
import { useReportFiltersStore } from '../reportFilters/store';

it('keeps custom dates when switching to a preset and back', () => {
  resetReportFilters('period');
  const initial = { from: '2024-01-01', to: '2024-03-31' };
  const custom = { from: '2023-02-01', to: '2023-05-01' };
  chooseReportPeriod('custom', initial);
  updateReportFilters('period', { custom });
  chooseReportPeriod('month', custom);
  chooseReportPeriod('custom', { from: '2026-01-01', to: '2026-01-31' });
  expect(useReportFiltersStore.getState().period.custom).toEqual(custom);
  resetReportFilters('period');
});
