import { keyRateOn } from '../keyRate';

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
