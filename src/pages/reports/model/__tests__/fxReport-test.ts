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
      yearBalance: 22,
      completedResult: -8,
      completedCount: 1,
      openCount: 0,
    });
    expect(report?.bonds[0]).toMatchObject({ invested: 30, received: 22, result: -8 });
    expect(report?.months).toHaveLength(12);
    expect(report?.months[0]).toMatchObject({ investedFx: 30, currentFx: 24 });
    expect(report?.months[5]).toMatchObject({ month: '2025-06', coupons: 2, currentFx: 26 });
    expect(report?.months[11]).toMatchObject({
      month: '2025-12',
      redemptions: 20,
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
      yearBalance: -18,
      completedCount: 0,
      openCount: 1,
    });
    expect(report?.bonds[0].result).toBeNull();
    expect(report?.months).toHaveLength(10);
    expect(report?.months[2]).toMatchObject({
      month: '2025-03',
      purchases: 20,
      investedFx: 20,
      currentFx: 18,
    });
    expect(report?.months[7]).toMatchObject({
      month: '2025-08',
      coupons: 2,
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

    expect(report?.months[2]).toMatchObject({ investedFx: 300, currentFx: 285.71 });
    expect(report?.months[3]).toMatchObject({ investedFx: 600, currentFx: 480 });
    expect(report?.months[4]).toMatchObject({ investedFx: 600, currentFx: 480 });
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

    expect(report?.months[4]).toMatchObject({ investedFx: 20, currentFx: 20 });
    expect(report?.months[5]).toMatchObject({ investedFx: 20, currentFx: 20 });
    expect(report?.months[6]).toMatchObject({ investedFx: 30, currentFx: 30 });
  });

  it('does not remove principal before today’s redemption is received', () => {
    const wallet = buildWallet(
      [purchase('first', redeemed.isin, '2025-01-10', 1000)],
      new Map([[redeemed.isin, redeemed]]),
      '2025-12-01',
    );
    const report = fxReport(wallet, 2025, () => 50);

    expect(report?.months[11]).toMatchObject({
      month: '2025-12',
      investedFx: 20,
      currentFx: 22,
      redemptions: 0,
    });
  });
});
