import type { Bond, Operation } from '@/lib/portfolio/portfolio';
import { buildWallet } from '@/lib/portfolio/wallet';

import { upcomingPurchases } from './upcomingPurchases';

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

const today = '2026-10-31';
// Planned while ahead of `today`, made (confirmed) before it.
const purchase = (id: string, date: string, amount: number): Operation => ({
  type: 'purchase',
  ovdp: null,
  planned: date > today,
  id,
  isin: bond.isin,
  date,
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
    today,
  );
  const [uah] = upcomingPurchases(wallet);
  /** The operations as on a later day, every one dated by then confirmed. */
  const confirmedBy = (day: string, operations = wallet.operations) =>
    operations.map((operation) => ({ ...operation, planned: operation.date > day }));

  it('lists the planned operations until the end of next month', () => {
    expect(uah.through).toBe('2026-11-30');
    expect(uah.operations.map(({ id }) => id)).toEqual(['2']);
  });

  it('sets the plan’s payments in that time against what the operations need', () => {
    expect(uah.amount).toBe(1010);
    expect(uah.planMoney).toBe(0);
    expect(uah.ownMoney).toBe(1010);
  });

  it('counts the plan’s payments coming in that time', () => {
    const december = buildWallet(confirmedBy('2026-11-30'), wallet.byIsin, '2026-11-30');
    const [next] = upcomingPurchases(december);
    expect(next.operations.map(({ id }) => id)).toEqual(['3']);
    // The December coupon of the two bonds bought before.
    expect(next.planMoney).toBe(160);
    expect(next.ownMoney).toBe(860);
  });

  it('needs no own money when the plan’s payments cover the operations', () => {
    const cheap = buildWallet(
      confirmedBy('2026-11-30', [
        purchase('1', '2026-03-01', 1000),
        purchase('2', '2026-12-20', 50),
      ]),
      wallet.byIsin,
      '2026-11-30',
    );
    expect(upcomingPurchases(cheap)[0].ownMoney).toBe(0);
  });

  it('does not pay for a purchase with a payment that comes after it', () => {
    const early = buildWallet(
      confirmedBy('2026-11-30', [
        ...wallet.operations.slice(0, 2),
        purchase('5', '2026-12-10', 100),
      ]),
      wallet.byIsin,
      '2026-11-30',
    );
    const [next] = upcomingPurchases(early);
    // The coupon of 15.12 (three bonds by then) comes after the purchase of 10.12.
    expect(next.planMoney).toBe(240);
    expect(next.ownMoney).toBe(100);
  });

  it('counts a payment due today, as it is still to come', () => {
    const couponDay = buildWallet(
      confirmedBy('2026-12-15', wallet.operations.slice(0, 3)),
      wallet.byIsin,
      '2026-12-15',
    );
    const [next] = upcomingPurchases(couponDay);
    expect(next.operations.map(({ id }) => id)).toEqual(['3']);
    expect(next.planMoney).toBe(160);
    expect(next.ownMoney).toBe(860);
  });

  it('keeps a planned purchase whose date has come until it is confirmed', () => {
    // On 30.11 the purchase of 20.11 is still planned: nobody said it took place.
    const unconfirmed = buildWallet(wallet.operations, wallet.byIsin, '2026-11-30');
    const [next] = upcomingPurchases(unconfirmed);
    expect(next.operations.map(({ id }) => id)).toEqual(['2', '3']);
    expect(next.amount).toBe(2030);
  });

  it('gives nothing without planned operations', () => {
    expect(upcomingPurchases(buildWallet([], wallet.byIsin, today))).toEqual([]);
  });
});
