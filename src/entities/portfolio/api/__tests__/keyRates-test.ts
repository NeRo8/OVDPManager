import { fillDailyRates } from '../dailyRates';
import { keyRateOn } from '../keyRate';

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

describe('keyRateOn', () => {
  const byYear = {
    2025: {
      rates: { '2025-03-06': 14.5, '2025-03-07': 15.5 },
      throughDate: '2025-03-07',
      updatedAt: 0,
    },
  };

  it('reads the rate on a date of a loaded year', () => {
    expect(keyRateOn(byYear, '2025-03-06')).toBe(14.5);
  });

  it('takes the last saved day for a later date of the year, as today before NBU publishes it', () => {
    expect(keyRateOn(byYear, '2025-03-09')).toBe(15.5);
  });

  it('has nothing for a year not loaded yet', () => {
    expect(keyRateOn(byYear, '2024-12-31')).toBeNull();
  });
});
