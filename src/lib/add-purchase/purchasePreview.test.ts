import type { Bond } from '@/lib/portfolio/portfolio';

import { purchasePreview } from './purchasePreview';

const bond: Bond = {
  isin: 'UA4000000001',
  nominal: 1000,
  rate: 16,
  currency: 'UAH',
  issueDate: '2026-01-01',
  maturityDate: '2027-07-01',
  description: '',
  payments: [
    { date: '2026-07-01', type: 'coupon', amount: 80 },
    { date: '2027-01-01', type: 'coupon', amount: 80 },
    { date: '2027-07-01', type: 'coupon', amount: 80 },
    { date: '2027-07-01', type: 'redemption', amount: 1000 },
  ],
};

const preview = (fields: Partial<Bond> = {}) =>
  purchasePreview({
    bond: { ...bond, ...fields },
    values: { date: '2026-03-01', quantity: 2, amount: 2000 },
    today: '2026-10-01',
    keyRate: 16,
    keyRateFailed: false,
    bonds: [],
  });

describe('purchasePreview', () => {
  it('sums the purchase up as a Position of one purchase', () => {
    expect(preview()).toMatchObject({
      // The July coupon is already paid by today; two are still to come.
      couponsLeft: 2,
      nextPayment: { date: '2027-01-01', type: 'coupon', total: 160 },
      totalPayments: 2480,
      netIncome: 480,
      returnPercent: 24,
    });
  });

  it('leaves the result out while NBU has not published the redemption', () => {
    const withoutRedemption = preview({
      payments: bond.payments.filter((payment) => payment.type === 'coupon'),
    });
    expect(withoutRedemption).toMatchObject({
      netIncome: null,
      returnPercent: null,
      annualYield: '—',
    });
  });
});
