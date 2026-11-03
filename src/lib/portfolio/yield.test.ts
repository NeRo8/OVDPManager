import { annualYield } from './yield';

describe('annualYield', () => {
  const date = '2025-01-01';
  const payments = [{ date: '2026-01-01', total: 1000 }];

  it('returns null when there is no amount or no payment', () => {
    expect(annualYield(0, date, payments)).toBeNull();
    expect(annualYield(1000, date, [])).toBeNull();
  });

  it('returns null beyond either end of the supported yield range', () => {
    expect(annualYield(1, date, payments)).toBeNull();
    expect(annualYield(100000, date, payments)).toBeNull();
  });

  it('keeps finite negative yields within the supported range', () => {
    expect(annualYield(2000, date, payments)).toBeCloseTo(-58.58, 2);
  });
});
