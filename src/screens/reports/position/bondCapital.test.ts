import type { Bond, Operation } from '@/lib/portfolio/portfolio';
import { buildWallet } from '@/lib/portfolio/wallet';

import { bondCapitalChart } from './bondCapital';

const bond: Bond = {
  isin: 'UA1',
  currency: 'UAH',
  nominal: 1000,
  rate: 10,
  issueDate: '2024-01-01',
  maturityDate: '2025-04-01',
  description: '',
  payments: [
    { date: '2025-02-01', type: 'coupon', amount: 50 },
    { date: '2025-04-01', type: 'redemption', amount: 1000 },
  ],
};
const purchase: Operation = {
  id: 'buy',
  type: 'purchase',
  isin: 'UA1',
  ovdp: bond,
  currency: 'UAH',
  date: '2025-01-01',
  quantity: 2,
  amount: 1800,
  planned: false,
};
const sale: Operation = {
  ...purchase,
  id: 'sale',
  type: 'sale',
  date: '2025-03-01',
  quantity: 1,
  amount: 1100,
};

describe('bondCapitalChart', () => {
  it('decreases the remaining cost and accumulates all proceeds through sale and maturity', () => {
    const item = buildWallet([purchase, sale], new Map(), '2025-05-01').positions[0];
    const chart = bondCapitalChart(item, '2025-05-01')!;
    expect(chart.dates).toEqual(['2025-01-01', '2025-02-01', '2025-03-01', '2025-04-01']);
    expect(chart.series.map(({ label, values }) => ({ label, values }))).toEqual([
      { label: 'Залишок вкладень · факт', values: [1800, 1800, 900, 0] },
      { label: 'Надходження · факт', values: [0, 100, 1200, 2200] },
    ]);
    expect(chart.positions[0]).toBe(0);
    expect(chart.positions[3]).toBe(1);
    expect(chart.positions[1]).toBeCloseTo(31 / 90);
  });

  it('separates overdue unconfirmed operations and future payments from the confirmed history', () => {
    const planned: Operation = {
      ...purchase,
      id: 'planned',
      date: '2025-02-10',
      quantity: 1,
      amount: 900,
      planned: true,
    };
    const item = buildWallet([purchase, planned], new Map(), '2025-03-01').positions[0];
    const chart = bondCapitalChart(item, '2025-03-01')!;
    const index = chart.dates.indexOf('2025-03-01');
    const series = Object.fromEntries(chart.series.map((line) => [line.label, line.values]));
    expect(series['Залишок вкладень · факт'][index]).toBe(1800);
    expect(series['Залишок вкладень · план'][index]).toBe(2700);
    expect(series['Надходження · факт'][index]).toBe(100);
    expect(series['Надходження · план'].at(-1)).toBe(3100);
    expect(series['Надходження · факт'].at(-1)).toBe(100);
  });

  it('apportions partial redemption and later sale to the remaining purchase cost', () => {
    const partial: Bond = {
      ...bond,
      payments: [
        { date: '2025-02-01', type: 'redemption', amount: 250 },
        { date: '2025-04-01', type: 'redemption', amount: 750 },
      ],
    };
    const item = buildWallet(
      [
        { ...purchase, ovdp: partial },
        { ...sale, ovdp: partial },
      ],
      new Map(),
      '2025-05-01',
    ).positions[0];
    const chart = bondCapitalChart(item, '2025-05-01')!;
    expect(chart.series[0].values).toEqual([1800, 1350, 675, 0]);
    expect(chart.series[1].values).toEqual([0, 500, 1600, 2350]);
  });

  it('credits a partial redemption before a sale on the same date', () => {
    const partial: Bond = {
      ...bond,
      payments: [
        { date: '2025-02-01', type: 'redemption', amount: 250 },
        { date: '2025-04-01', type: 'redemption', amount: 750 },
      ],
    };
    const sameDay = { ...sale, date: '2025-02-01', ovdp: partial };
    const item = buildWallet([{ ...purchase, ovdp: partial }, sameDay], new Map(), '2025-03-01')
      .positions[0];
    const chart = bondCapitalChart(item, '2025-03-01')!;
    const index = chart.dates.indexOf('2025-02-01');
    expect(chart.series[0].values[index]).toBe(675);
    expect(chart.series[1].values[index]).toBe(1600);
  });

  it('does not invent a cost-basis graph without bond data', () => {
    const item = buildWallet([{ ...purchase, ovdp: null }], new Map(), '2025-05-01').positions[0];
    expect(bondCapitalChart(item, '2025-05-01')).toBeNull();
  });

  it('keeps received payments when an overdue planned sale would have removed the entitlement', () => {
    const plannedSale: Operation = {
      ...sale,
      date: '2025-01-15',
      quantity: 2,
      amount: 1900,
      planned: true,
    };
    const item = buildWallet([purchase, plannedSale], new Map(), '2025-03-01').positions[0];
    const chart = bondCapitalChart(item, '2025-03-01')!;
    const couponIndex = chart.dates.indexOf('2025-02-01');
    const series = Object.fromEntries(chart.series.map((line) => [line.label, line.values]));
    expect(couponIndex).toBeGreaterThanOrEqual(0);
    expect(series['Залишок вкладень · факт'][couponIndex]).toBe(1800);
    expect(series['Надходження · факт'][couponIndex]).toBe(100);
    expect(series['Залишок вкладень · план'][couponIndex]).toBe(0);
    // The past coupon stays until the sale is confirmed, so the plan counts both.
    expect(series['Надходження · план'][couponIndex]).toBe(2000);
  });

  it('does not show factual lines if a confirmed sale depends on a planned purchase', () => {
    const pending: Operation = { ...purchase, planned: true };
    const item = buildWallet([pending, sale], new Map(), '2025-05-01').positions[0];
    const chart = bondCapitalChart(item, '2025-05-01')!;
    expect(chart.actualAvailable).toBe(false);
    expect(chart.series.map((line) => line.label)).toEqual([
      'Залишок вкладень · план',
      'Надходження · план',
    ]);
  });
});
