import { buildWallet } from '@/lib/portfolio/wallet';

import { monthsInSpan, periodDates } from './periodDates';

const wallet = buildWallet([], new Map(), '2026-05-20');

describe('periodDates', () => {
  it('fits calendar periods around today', () => {
    expect(periodDates('quarter', wallet)).toEqual({ from: '2026-04-01', to: '2026-06-30' });
    expect(periodDates('lastQuarter', wallet)).toEqual({ from: '2026-01-01', to: '2026-03-31' });
    expect(periodDates('last12Months', wallet)).toEqual({ from: '2025-05-01', to: '2026-04-30' });
  });

  it('keeps a saved custom period and falls back to the default if it is absent', () => {
    expect(periodDates('custom', wallet, { from: '2025-01-15', to: '2025-02-20' })).toEqual({
      from: '2025-01-15',
      to: '2025-02-20',
    });
    expect(periodDates('custom', wallet)).toEqual(periodDates('last12Months', wallet));
  });

  it('counts partial months in proportion to their days', () => {
    expect(monthsInSpan('2025-01-15', '2025-02-14')).toBeCloseTo(17 / 31 + 14 / 28);
  });
});
