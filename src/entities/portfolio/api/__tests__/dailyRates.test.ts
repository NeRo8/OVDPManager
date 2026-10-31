import { fillDailyRates } from '../dailyRates';

const missing = (date: string) => `немає ставки на ${date}`;

describe('fillDailyRates', () => {
  it('gives every day the rate in effect on it, also days NBU skipped', () => {
    const rates = fillDailyRates(
      [
        { date: '2025-01-03', rate: 14.5 },
        { date: '2024-12-27', rate: 13.5 },
      ],
      '2025-01-01',
      '2025-01-04',
      missing,
    );
    expect(rates).toEqual({
      '2025-01-01': 13.5,
      '2025-01-02': 13.5,
      '2025-01-03': 14.5,
      '2025-01-04': 14.5,
    });
  });

  it('fails when nothing was published up to the first day', () => {
    expect(() =>
      fillDailyRates([{ date: '2025-01-02', rate: 14.5 }], '2025-01-01', '2025-01-02', missing),
    ).toThrow('немає ставки на 2025-01-01');
  });
});
