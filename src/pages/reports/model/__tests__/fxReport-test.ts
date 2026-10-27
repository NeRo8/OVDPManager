import { type Bond, type Purchase, buildWallet } from '@/entities/portfolio';
import { fxEventDates, fxReport } from '../fxReport';

const redeemed: Bond = {
  isin: 'UA4000000001',
  currency: 'UAH',
  nominal: 1000,
  rate: 10,
  issueDate: '2024-01-01',
  maturityDate: '2025-12-01',
  description: 'ОВДП',
  payments: [
    { date: '2025-06-01', type: 'coupon', amount: 100 },
    { date: '2025-12-01', type: 'redemption', amount: 1000 },
  ],
};

const active: Bond = {
  ...redeemed,
  isin: 'UA4000000002',
  maturityDate: '2027-12-01',
  payments: [
    { date: '2025-08-01', type: 'coupon', amount: 100 },
    { date: '2026-08-01', type: 'coupon', amount: 100 },
    { date: '2027-12-01', type: 'redemption', amount: 1000 },
  ],
};

function purchase(id: string, isin: string, purchaseDate: string, amount: number): Purchase {
  return { id, isin, purchaseDate, amount, quantity: 1, currency: 'UAH' };
}

describe('fxReport', () => {
  it('includes a previous-year purchase in a redeemed bond’s USD result', () => {
    const wallet = buildWallet(
      [purchase('first', redeemed.isin, '2024-10-01', 1200)],
      new Map([[redeemed.isin, redeemed]]),
      '2026-02-01',
    );
    const rates: Record<string, number> = {
      '2024-10-01': 40,
      '2025-06-01': 50,
      '2025-12-01': 50,
    };
    const report = fxReport(
      wallet,
      2025,
      (date) => rates[date] ?? (date.startsWith('2025') ? 50 : null),
    );

    expect(fxEventDates(wallet, 2025)).toContain('2024-10-01');
    expect(fxEventDates(wallet, 2025)).toContain('2025-01-31');
    expect(fxEventDates(wallet, 2025)).toContain('2025-12-31');
    expect(report).toMatchObject({
      purchases: 0,
      coupons: 2,
      redemptions: 20,
      balance: 22,
      completedResult: -8,
      completedCount: 1,
      openCount: 0,
      snapshot: {
        invested: 30,
        received: 22,
        remainingCost: 0,
        payoutsAndRemaining: 22,
        estimatedDifference: -8,
      },
    });
    expect(report?.bonds[0]).toMatchObject({ invested: 30, received: 22, result: -8 });
    expect(report?.points).toHaveLength(12);
    expect(report?.points[0]).toMatchObject({ investedFx: 30, currentFx: 24 });
    expect(report?.points[5]).toMatchObject({ period: '2025-06', currentFx: 26 });
    expect(report?.points[11]).toMatchObject({
      period: '2025-12',
      investedFx: 30,
      currentFx: 22,
    });
  });

  it('excludes future payments and leaves an active bond’s result open', () => {
    const wallet = buildWallet(
      [purchase('second', active.isin, '2025-03-01', 900)],
      new Map([[active.isin, active]]),
      '2025-10-01',
    );
    const rates: Record<string, number> = { '2025-03-01': 45, '2025-08-01': 50 };
    const report = fxReport(wallet, 2025, (date) => rates[date] ?? 50);

    expect(fxEventDates(wallet, 2025)).toContain('2025-03-01');
    expect(fxEventDates(wallet, 2025)).toContain('2025-10-01');
    expect(fxEventDates(wallet, 2025)).not.toContain('2025-10-31');
    expect(report).toMatchObject({
      purchases: 20,
      coupons: 2,
      redemptions: 0,
      balance: -18,
      completedCount: 0,
      openCount: 1,
      snapshot: {
        invested: 20,
        received: 2,
        remainingCost: 18,
        payoutsAndRemaining: 20,
        estimatedDifference: 0,
      },
    });
    expect(report?.bonds[0].result).toBeNull();
    expect(report?.points).toHaveLength(10);
    expect(report?.points[2]).toMatchObject({
      period: '2025-03',
      investedFx: 20,
      currentFx: 18,
    });
    expect(report?.points[7]).toMatchObject({
      period: '2025-08',
      investedFx: 20,
      currentFx: 20,
    });
    expect(fxReport(wallet, 2025, () => null)).toBeNull();
  });

  it('adds each purchase to the currency baseline and revalues the UAH cost each month', () => {
    const wallet = buildWallet(
      [
        purchase('march', active.isin, '2025-03-01', 12000),
        purchase('april', active.isin, '2025-04-01', 12000),
      ],
      new Map([[active.isin, active]]),
      '2025-05-15',
    );
    const report = fxReport(wallet, 2025, (date) => {
      if (date === '2025-03-01' || date === '2025-04-01') return 40;
      if (date === '2025-03-31') return 42;
      return 50;
    });

    expect(report?.points[2]).toMatchObject({ investedFx: 300, currentFx: 285.71 });
    expect(report?.points[3]).toMatchObject({ investedFx: 600, currentFx: 480 });
    expect(report?.points[4]).toMatchObject({ investedFx: 600, currentFx: 480 });
  });

  it('keeps received partial redemption in the second line without double-counting cost', () => {
    const amortizing: Bond = {
      ...redeemed,
      maturityDate: '2026-12-01',
      payments: [
        { date: '2025-06-01', type: 'redemption', amount: 500 },
        { date: '2026-12-01', type: 'redemption', amount: 500 },
      ],
    };
    const wallet = buildWallet(
      [
        purchase('first', amortizing.isin, '2025-01-10', 1000),
        purchase('top-up', amortizing.isin, '2025-07-01', 500),
      ],
      new Map([[amortizing.isin, amortizing]]),
      '2025-08-01',
    );
    const report = fxReport(wallet, 2025, () => 50);

    expect(report?.points[4]).toMatchObject({ investedFx: 20, currentFx: 20 });
    expect(report?.points[5]).toMatchObject({ investedFx: 20, currentFx: 20 });
    expect(report?.points[6]).toMatchObject({ investedFx: 30, currentFx: 30 });
  });

  it('does not remove principal before today’s redemption is received', () => {
    const wallet = buildWallet(
      [purchase('first', redeemed.isin, '2025-01-10', 1000)],
      new Map([[redeemed.isin, redeemed]]),
      '2025-12-01',
    );
    const report = fxReport(wallet, 2025, () => 50);

    expect(report?.points[11]).toMatchObject({
      period: '2025-12',
      investedFx: 20,
      currentFx: 22,
    });
    expect(report?.redemptions).toBe(0);
  });

  it('compares twelve monthly 300 USD purchases with cash returned at year end', () => {
    const monthlyBond: Bond = {
      ...redeemed,
      nominal: 12000,
      maturityDate: '2025-12-31',
      payments: [
        { date: '2025-12-31', type: 'coupon', amount: 600 },
        { date: '2025-12-31', type: 'redemption', amount: 12000 },
      ],
    };
    const purchases = Array.from({ length: 12 }, (_, index) =>
      purchase(
        `month-${index + 1}`,
        monthlyBond.isin,
        `2025-${String(index + 1).padStart(2, '0')}-01`,
        12000,
      ),
    );
    const wallet = buildWallet(purchases, new Map([[monthlyBond.isin, monthlyBond]]), '2026-01-15');
    const report = fxReport(wallet, 2025, () => 40);

    expect(report?.snapshot).toEqual({
      invested: 3600,
      received: 3780,
      remainingCost: 0,
      payoutsAndRemaining: 3780,
      estimatedDifference: 180,
    });
    expect(report?.points[11]).toMatchObject({ investedFx: 3600, currentFx: 3780 });
    expect(report?.completedResult).toBe(180);
  });

  it('counts a reinvested coupon as both a received payout and a new purchase', () => {
    const firstBond: Bond = {
      ...active,
      nominal: 12000,
      payments: [
        { date: '2025-06-01', type: 'coupon', amount: 1200 },
        { date: '2027-12-01', type: 'redemption', amount: 12000 },
      ],
    };
    const secondBond: Bond = {
      ...active,
      isin: 'UA4000000003',
      nominal: 1200,
      payments: [{ date: '2027-12-01', type: 'redemption', amount: 1200 }],
    };
    const wallet = buildWallet(
      [
        purchase('initial', firstBond.isin, '2025-01-01', 12000),
        purchase('reinvested-coupon', secondBond.isin, '2025-07-01', 1200),
      ],
      new Map([
        [firstBond.isin, firstBond],
        [secondBond.isin, secondBond],
      ]),
      '2026-01-01',
    );
    const report = fxReport(wallet, 2025, () => 40);

    expect(report?.snapshot).toEqual({
      invested: 330,
      received: 30,
      remainingCost: 330,
      payoutsAndRemaining: 360,
      estimatedDifference: 30,
    });
    expect(fxReport(wallet, null, () => 40)?.snapshot).toEqual(report?.snapshot);
  });

  it('includes every past UAH purchase across years, even without activity in an intervening year', () => {
    const quietBond: Bond = {
      ...active,
      isin: 'UA4000000003',
      payments: [{ date: '2027-12-01', type: 'redemption', amount: 1000 }],
    };
    const laterBond: Bond = {
      ...active,
      payments: [
        { date: '2026-08-01', type: 'coupon', amount: 100 },
        { date: '2027-12-01', type: 'redemption', amount: 1000 },
      ],
    };
    const wallet = buildWallet(
      [
        purchase('old', quietBond.isin, '2024-06-01', 4000),
        purchase('new', laterBond.isin, '2026-03-01', 5000),
      ],
      new Map([
        [quietBond.isin, quietBond],
        [laterBond.isin, laterBond],
      ]),
      '2026-10-01',
    );
    const rateOn = (date: string) =>
      date.startsWith('2024') ? 40 : date.startsWith('2025') ? 45 : 50;
    const report = fxReport(wallet, null, rateOn);

    expect(fxEventDates(wallet, null)).toEqual(
      expect.arrayContaining(['2024-06-01', '2024-06-30', '2025-12-31', '2026-10-01']),
    );
    expect(report?.points).toHaveLength(29);
    expect(report?.points[0]).toEqual({ period: '2024-06', investedFx: 100, currentFx: 100 });
    expect(report?.points[18]).toEqual({
      period: '2025-12',
      investedFx: 100,
      currentFx: 88.89,
    });
    expect(report?.points.at(-1)).toEqual({ period: '2026-10', investedFx: 200, currentFx: 182 });
    expect(report?.years).toEqual([
      { year: 2024, purchases: 100, coupons: 0, redemptions: 0, balance: -100 },
      { year: 2025, purchases: 0, coupons: 0, redemptions: 0, balance: 0 },
      { year: 2026, purchases: 100, coupons: 2, redemptions: 0, balance: -98 },
    ]);
    expect(report?.snapshot).toEqual({
      invested: 200,
      received: 2,
      remainingCost: 180,
      payoutsAndRemaining: 182,
      estimatedDifference: -18,
    });
    expect(report?.bonds).toHaveLength(2);
    expect(report?.bonds.find(({ isin }) => isin === quietBond.isin)?.events).toHaveLength(1);
  });

  it('keeps monthly points when the all-time period covers only one year', () => {
    const wallet = buildWallet(
      [purchase('first', active.isin, '2025-03-01', 900)],
      new Map([[active.isin, active]]),
      '2025-10-01',
    );
    const report = fxReport(wallet, null, () => 50);

    expect(report?.fromDate).toBe('2025-03-01');
    expect(report?.points.map(({ period }) => period)).toEqual([
      '2025-03',
      '2025-04',
      '2025-05',
      '2025-06',
      '2025-07',
      '2025-08',
      '2025-09',
      '2025-10',
    ]);
  });
});
