import { couponGoalFormSchema } from './couponGoalForm.schema';

const input = {
  kind: 'ovdp',
  currency: 'UAH',
  year: 2028,
  incomeYears: 1,
  purchaseYears: 1,
  payouts: 'reinvest',
  monthly: '5 000,50',
};

it('turns the entered amount and reinvestment choice into a goal', () => {
  expect(couponGoalFormSchema.parse(input)).toEqual({
    kind: 'ovdp',
    currency: 'UAH',
    year: 2028,
    incomeYears: 1,
    purchaseYears: 1,
    monthly: 5000.5,
    reinvest: true,
  });
  expect(couponGoalFormSchema.parse({ ...input, payouts: 'withdraw' }).reinvest).toBe(false);
});

it.each([
  { monthly: '' },
  { monthly: '0' },
  { monthly: 'не число' },
  { monthly: '999999999999999999999999' },
  { currency: 'GBP' },
  { kind: 'other' },
  { payouts: 'other' },
  { incomeYears: 0 },
  { incomeYears: 6 },
  { purchaseYears: 0 },
  { purchaseYears: 4 },
  { year: 2028.5 },
  { year: 1999 },
])('rejects invalid input: %p', (invalid) => {
  expect(couponGoalFormSchema.safeParse({ ...input, ...invalid }).success).toBe(false);
});
