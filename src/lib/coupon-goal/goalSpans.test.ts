import { goalMonthIndex, goalPurchaseSpan, goalYears, monthStarts } from './goalSpans';

it('offers coupon years only when there is time to buy beforehand', () => {
  expect(goalYears('2026-10-31')).toEqual([2027, 2028, 2029, 2030, 2031]);
  expect(goalYears('2026-12-31')).toEqual([2028, 2029, 2030, 2031]);
});

it('starts buying tomorrow when the first purchase year is already underway', () => {
  expect(goalPurchaseSpan({ year: 2028, purchaseYears: 2 }, '2026-10-31')).toEqual({
    from: '2026-11-01',
    to: '2027-12-31',
  });
  expect(goalPurchaseSpan({ year: 2028, purchaseYears: 1 }, '2026-10-31')).toEqual({
    from: '2027-01-01',
    to: '2027-12-31',
  });
  expect(
    goalPurchaseSpan({ year: 2031, purchaseEndYear: 2028, purchaseYears: 2 }, '2026-10-31'),
  ).toEqual({
    from: '2027-01-01',
    to: '2028-12-31',
  });
  expect(monthStarts({ from: '2026-11-16', to: '2027-02-28' })).toEqual([
    '2026-11-16',
    '2026-12-01',
    '2027-01-01',
    '2027-02-01',
  ]);
});

it('places coupon payments only within the selected years', () => {
  const goal = { year: 2028, incomeYears: 2 };
  expect(goalMonthIndex(goal, '2027-12-31')).toBe(-1);
  expect(goalMonthIndex(goal, '2028-01-01')).toBe(0);
  expect(goalMonthIndex(goal, '2029-12-31')).toBe(23);
  expect(goalMonthIndex(goal, '2030-01-01')).toBe(-1);
});
