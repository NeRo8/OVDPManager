import { yearOverYearReport } from '../yearOverYearReport';

import { plannedWallet } from './plannedWallet';

describe('yearOverYearReport', () => {
  it('marks the years whose sums are partly a forecast', () => {
    const [report] = yearOverYearReport(plannedWallet);
    // 2025 is all past; 2026 has the planned purchase and a coupon ahead; 2027 is all ahead.
    expect(report.years.map(({ year, forecast }) => [year, forecast])).toEqual([
      [2025, false],
      [2026, true],
      [2027, true],
    ]);
  });
});
