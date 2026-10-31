import { type Bond, type Purchase, buildWallet } from '@/entities/portfolio';

import { upcomingPurchases } from '../upcomingPurchases';

const bond: Bond = {
  isin: 'UA4000000001',
  nominal: 1000,
  rate: 16,
  currency: 'UAH',
  issueDate: '2026-01-01',
  maturityDate: '2027-06-15',
  description: '',
  payments: [
    { date: '2026-06-15', type: 'coupon', amount: 80 },
    { date: '2026-12-15', type: 'coupon', amount: 80 },
    { date: '2027-06-15', type: 'coupon', amount: 80 },
    { date: '2027-06-15', type: 'redemption', amount: 1000 },
  ],
};

const purchase = (id: string, purchaseDate: string, amount: number): Purchase => ({
  id,
  isin: bond.isin,
  purchaseDate,
  amount,
  quantity: 1,
  currency: 'UAH',
});

describe('upcomingPurchases', () => {
  const wallet = buildWallet(
    [
      // Made: not upcoming, but it brings the December payments.
      purchase('1', '2026-03-01', 1000),
      purchase('2', '2026-11-20', 1010),
      purchase('3', '2026-12-20', 1020),
      // After the end of next month.
      purchase('4', '2027-01-05', 1030),
    ],
    new Map([[bond.isin, bond]]),
    '2026-10-31',
  );
  const [uah] = upcomingPurchases(wallet);

  it('lists the planned purchases until the end of next month', () => {
    expect(uah.through).toBe('2026-11-30');
    expect(uah.purchases.map(({ id }) => id)).toEqual(['2']);
  });

  it('sets the plan’s payments in that time against what the purchases need', () => {
    expect(uah.amount).toBe(1010);
    expect(uah.planMoney).toBe(0);
    expect(uah.ownMoney).toBe(1010);
  });

  it('counts the plan’s payments coming in that time', () => {
    const december = buildWallet(wallet.purchases, wallet.byIsin, '2026-11-30');
    const [next] = upcomingPurchases(december);
    expect(next.purchases.map(({ id }) => id)).toEqual(['3']);
    // The December coupon of the two bonds bought before.
    expect(next.planMoney).toBe(160);
    expect(next.ownMoney).toBe(860);
  });

  it('needs no own money when the plan’s payments cover the purchases', () => {
    const cheap = buildWallet(
      [purchase('1', '2026-03-01', 1000), purchase('2', '2026-12-20', 50)],
      wallet.byIsin,
      '2026-11-30',
    );
    expect(upcomingPurchases(cheap)[0].ownMoney).toBe(0);
  });

  it('gives nothing without planned purchases', () => {
    expect(upcomingPurchases(buildWallet([], wallet.byIsin, '2026-10-31'))).toEqual([]);
  });
});
