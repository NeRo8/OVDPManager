import type { Bond, Operation } from '@/lib/portfolio/portfolio';
import { buildWallet } from '@/lib/portfolio/wallet';
import { flowTables } from '@/screens/reports/shared/flowTables';
import { formatAmount } from '@/utils/format';

import { cashFlowCharts } from './cashFlowCharts';

const bond: Bond = {
  isin: 'UA1',
  currency: 'UAH',
  nominal: 1000,
  rate: 10,
  issueDate: '2025-01-01',
  maturityDate: '2027-01-01',
  description: '',
  payments: [{ date: '2026-02-01', type: 'coupon', amount: 50 }],
};
const purchase: Operation = {
  id: 'purchase',
  type: 'purchase',
  isin: bond.isin,
  ovdp: bond,
  currency: 'UAH',
  date: '2026-01-10',
  quantity: 1,
  amount: 900,
  planned: false,
};

describe('cashFlowCharts', () => {
  it('groups a single year into one annual total when comparing years', () => {
    const planned = { ...purchase, id: 'planned', date: '2026-03-01', amount: 950, planned: true };
    const wallet = buildWallet([purchase, planned], new Map(), '2026-01-15');
    const [chart] = cashFlowCharts(wallet, '2026-01-01', '2026-12-31', 'year');

    expect(chart.periods).toEqual([
      { label: '2026', purchases: 900, planned: 950, coupons: 50, redemptions: 0, sales: 0 },
    ]);
  });

  it('keeps every month of the selected year, including months without events', () => {
    const planned = { ...purchase, id: 'planned', date: '2026-03-01', amount: 950, planned: true };
    const outside = { ...purchase, id: 'outside', date: '2025-02-01', amount: 700 };
    const wallet = buildWallet([purchase, planned, outside], new Map(), '2026-01-15');
    const [chart] = cashFlowCharts(wallet, '2026-01-01', '2026-12-31');

    expect(chart.periods.map((period) => period.label)).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
      '2026-12',
    ]);
    expect(chart.periods[0]).toMatchObject({ purchases: 900, planned: 0 });
    expect(chart.periods[1]).toMatchObject({ coupons: 100 });
    expect(chart.periods[2]).toMatchObject({ purchases: 0, planned: 950 });
    expect(chart.periods[11]).toMatchObject({ purchases: 0, coupons: 0, redemptions: 0, sales: 0 });

    const [operations, payments] = flowTables(chart.currency, chart.periods, true).map(
      (section) => section.table!,
    );
    expect(operations.columns).toEqual(['Купівлі', 'Продажі']);
    expect(payments.columns).toEqual(['Купони', 'Погашення']);
    expect(operations.rows[0].label).toBe('січ');
    expect(payments.rows[11].label).toBe('гру');
    expect(operations.currency).toBe('UAH');
    expect(operations.rows[2].values[0]).toBe(formatAmount(950));
    expect(payments.rows[1].values[0]).toBe(formatAmount(100));
  });

  it('distinguishes the same month in different years and includes planned purchases', () => {
    const periods = [
      { label: '2025-01', purchases: 100000, planned: 500, coupons: 20, redemptions: 0, sales: 10 },
      { label: '2026-01', purchases: 0, planned: 0, coupons: 30, redemptions: 40, sales: 0 },
    ];
    const [operations, payments] = flowTables('UAH', periods).map((section) => section.table!);
    expect(operations.rows.map((row) => row.label)).toEqual(['січ 2025', 'січ 2026']);
    expect(operations.rows[0].values).toEqual([formatAmount(100500), formatAmount(10)]);
    expect(payments.rows[1].values).toEqual([formatAmount(30), formatAmount(40)]);
  });
});
