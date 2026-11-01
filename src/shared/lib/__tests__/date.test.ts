import {
  addDaysISO,
  addMonthsISO,
  daysBetween,
  formatDate,
  formatDaysLeft,
  formatTimeLeft,
  monthRange,
  toISODate,
} from '../date';

// A no-break space keeps a number with its unit.
const NBSP = ' ';

describe('calendar dates', () => {
  it('writes a date the Ukrainian way and reads a local day as one', () => {
    expect(formatDate('2026-03-05')).toBe('05.03.2026');
    expect(toISODate(new Date(2026, 2, 5, 23, 59))).toBe('2026-03-05');
  });

  it('moves by months to the same day, the month’s last day when it has no such day', () => {
    expect(addMonthsISO('2026-01-15', 1)).toBe('2026-02-15');
    expect(addMonthsISO('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonthsISO('2026-03-31', -1)).toBe('2026-02-28');
    expect(addMonthsISO('2026-10-31', 12)).toBe('2027-10-31');
  });

  it('moves by days across months and years', () => {
    expect(addDaysISO('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('counts calendar days, whatever the clock change in between', () => {
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2);
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2026-11-02', '2026-10-31')).toBe(-2);
  });

  it('gives a month’s first and last day, or another month’s', () => {
    expect(monthRange('2026-10-15')).toEqual({ from: '2026-10-01', to: '2026-10-31' });
    expect(monthRange('2026-10-15', 1)).toEqual({ from: '2026-11-01', to: '2026-11-30' });
    expect(monthRange('2026-12-15', 2)).toEqual({ from: '2027-02-01', to: '2027-02-28' });
  });
});

describe('time left', () => {
  it('says today, tomorrow, or in how many days', () => {
    expect(formatDaysLeft(0)).toBe('сьогодні');
    expect(formatDaysLeft(1)).toBe('завтра');
    expect(formatDaysLeft(2)).toBe(`через 2${NBSP}дні`);
    expect(formatDaysLeft(5)).toBe(`через 5${NBSP}днів`);
    expect(formatDaysLeft(21)).toBe(`через 21${NBSP}день`);
  });

  it('counts whole years and months, and days under a month', () => {
    expect(formatTimeLeft('2026-10-15', '2029-01-20')).toBe(`2${NBSP}р 3${NBSP}міс`);
    expect(formatTimeLeft('2026-10-15', '2027-06-20')).toBe(`8${NBSP}міс`);
    expect(formatTimeLeft('2026-10-15', '2027-10-15')).toBe(`1${NBSP}р`);
    expect(formatTimeLeft('2026-10-15', '2026-10-27')).toBe(`12${NBSP}днів`);
  });
});
