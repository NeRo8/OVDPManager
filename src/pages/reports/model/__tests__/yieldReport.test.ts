import { buildWallet } from '@/entities/portfolio';

import { keyRateAt, yieldChartBonds, yieldReport } from '../yieldReport';

import { bond, plannedWallet } from './plannedWallet';

describe('keyRateAt', () => {
  it('weights each purchase date by the amount paid', () => {
    const rateOn = (date: string) => (date.startsWith('2025') ? 10 : 20);
    expect(keyRateAt(plannedWallet.purchases, rateOn)).toBe(15.96);
  });

  it('does not calculate an average until every purchase rate is available', () => {
    expect(keyRateAt(plannedWallet.purchases, (date) => (date.startsWith('2025') ? 10 : null))).toBeNull();
    expect(keyRateAt([], () => 10)).toBeNull();
  });
});

describe('yieldReport', () => {
  it('keeps unknown yields last and excludes them from the averages', () => {
    const missing = { ...plannedWallet.purchases[0], id: 'missing', isin: 'UA000UNKNOWN' };
    const wallet = buildWallet(
      [missing, ...plannedWallet.purchases],
      new Map([[bond.isin, bond]]),
      plannedWallet.today,
    );
    const [report] = yieldReport(wallet, 'all', () => 15);
    expect(report.bonds.map(({ isin }) => isin)).toEqual([bond.isin, missing.isin]);
    expect(report.bonds[1].annualYield).toBeNull();
    expect(report.withoutYield).toBe(1);
    expect(report.averageRate).toBe(10);
    expect(report.averageYield).toBe(wallet.positions.find((item) => item.bond)?.annualYield);
    expect(report.keyRate).toBe(15);
  });

  it('leaves rates unknown until loaded and filters redeemed positions', () => {
    const [report] = yieldReport(plannedWallet, 'all', () => null);
    expect(report.keyRate).toBeNull();
    expect(report.bonds[0].keyRateAtPurchase).toBeNull();
    expect(yieldReport(plannedWallet, 'redeemed', () => 15)).toEqual([]);
    expect(yieldReport(plannedWallet, 'inCirculation', () => 15)).toHaveLength(1);
  });

  it('weights coupon rates by investment and does not compare foreign bonds with the key rate', () => {
    const second = { ...bond, isin: 'UA4000000002', rate: 20 };
    const foreign = { ...bond, isin: 'UA4000000003', currency: 'USD' as const };
    const other = { ...plannedWallet.purchases[0], id: 'second', isin: second.isin, amount: 1000 };
    const usd = { ...other, id: 'usd', isin: foreign.isin, currency: 'USD' as const };
    const wallet = buildWallet(
      [...plannedWallet.purchases, other, usd],
      new Map([[bond.isin, bond], [second.isin, second], [foreign.isin, foreign]]),
      plannedWallet.today,
    );
    const [uah, dollar] = yieldReport(wallet, 'all', () => 15);
    expect(uah.averageRate).toBe(11.68);
    expect(dollar.currency).toBe('USD');
    expect(dollar.keyRate).toBeNull();
    expect(dollar.bonds[0].keyRateAtPurchase).toBeNull();
  });

  it('keeps both the highest and lowest values when limiting chart rows', () => {
    expect(yieldChartBonds([9, 8, 7, 6, 5, 4])).toEqual([9, 8, 7, 6, 4]);
    expect(yieldChartBonds([3, 2, 1])).toEqual([3, 2, 1]);
  });
});
