import { periodChartPeriods } from '../periodChart';

describe('period chart periods', () => {
  it('preserves monthly detail for a year or less', () => {
    const months = [{ month: '2026-01', invested: 100, planned: 0, coupons: 10, redemptions: 0 }];
    expect(periodChartPeriods(months)).toBe(months);
  });

  it('groups a long period into calendar years without dropping partial years', () => {
    const months = Array.from({ length: 14 }, (_, index) => ({
      month: `${index < 12 ? 2025 : 2026}-${String((index % 12) + 1).padStart(2, '0')}`,
      invested: 10,
      // The last month's purchase is planned.
      planned: index === 13 ? 10 : 0,
      coupons: 1,
      redemptions: index === 13 ? 50 : 0,
    }));

    expect(periodChartPeriods(months)).toEqual([
      { month: '2025', invested: 120, planned: 0, coupons: 12, redemptions: 0 },
      { month: '2026', invested: 20, planned: 10, coupons: 2, redemptions: 50 },
    ]);
  });
});
