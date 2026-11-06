import { movePeriodHandle, type PeriodRangeLimits } from './periodRange';

const limits: PeriodRangeLimits = {
  min: 2026,
  max: 2036,
  latestCouponStart: 2031,
  maxPurchaseYears: 3,
  maxCouponYears: 5,
};

describe('periodRange', () => {
  it('keeps both ranges nonempty, within their limits, and in order', () => {
    const range: [number, number, number, number] = [2026, 2028, 2029, 2032];
    expect(movePeriodHandle(range, 0, 2034, limits)).toEqual([2027, 2028, 2029, 2032]);
    expect(movePeriodHandle(range, 1, 2035, limits)).toEqual([2026, 2029, 2029, 2032]);
    expect(movePeriodHandle(range, 2, 2020, limits)).toEqual([2026, 2028, 2028, 2032]);
    expect(movePeriodHandle(range, 3, 2040, limits)).toEqual([2026, 2028, 2029, 2034]);
  });

  it('allows a gap between investments and coupons', () => {
    expect(movePeriodHandle([2026, 2027, 2027, 2030], 2, 2028, limits)).toEqual([
      2026, 2027, 2028, 2030,
    ]);
  });
});
