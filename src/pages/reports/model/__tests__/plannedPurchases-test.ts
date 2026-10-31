import { type ActiveWallet, type Bond, type Purchase, buildWallet } from '@/entities/portfolio';

import { portfolioReport } from '../portfolioReport';
import { redemptionsReport } from '../redemptionsReport';
import { portfolioPdf, redemptionsPdf, yearsPdf } from '../reportPdf';
import { structureReport } from '../structureReport';
import { yearOverYearReport } from '../yearOverYearReport';

/** How each report tells the purchases still planned, and the years they make a forecast of. */

const bond: Bond = {
  isin: 'UA4000000001',
  currency: 'UAH',
  nominal: 1000,
  rate: 10,
  issueDate: '2024-09-01',
  maturityDate: '2027-03-01',
  description: 'ОВДП',
  payments: [
    { date: '2025-09-01', type: 'coupon', amount: 50 },
    { date: '2026-09-01', type: 'coupon', amount: 50 },
    { date: '2027-03-01', type: 'coupon', amount: 50 },
    { date: '2027-03-01', type: 'redemption', amount: 1000 },
  ],
};

function purchase(id: string, purchaseDate: string, quantity: number, amount: number): Purchase {
  return { id, isin: bond.isin, purchaseDate, amount, quantity, currency: 'UAH' };
}

const today = '2026-03-01';
// Two bonds bought, three more planned for June.
const wallet = buildWallet(
  [purchase('made', '2025-01-10', 2, 2000), purchase('planned', '2026-06-01', 3, 2950)],
  new Map([[bond.isin, bond]]),
  today,
);

describe('payments of bonds still planned', () => {
  it('counts the planned bonds of each payment', () => {
    expect(
      wallet.payments.map(({ date, quantity, plannedQuantity }) => [
        date,
        quantity,
        plannedQuantity,
      ]),
    ).toEqual([
      ['2025-09-01', 2, 0],
      ['2026-09-01', 5, 3],
      ['2027-03-01', 5, 3],
      ['2027-03-01', 5, 3],
    ]);
  });
});

describe('redemptionsReport', () => {
  it('tells what of the redemptions ahead repays planned purchases', () => {
    const [report] = redemptionsReport(wallet, 'upcoming');
    expect(report).toMatchObject({ total: 5000, expected: 5000, planned: 3000 });
  });
});

describe('portfolioReport', () => {
  it('tells what of the money in a bond is still planned', () => {
    const [report] = portfolioReport(wallet, 'all');
    expect(report.planned).toBe(2950);
    expect(report.bonds[0]).toMatchObject({ invested: 4950, planned: 2950 });
  });
});

describe('structureReport', () => {
  it('counts the planned money only when planned purchases are let in', () => {
    expect(structureReport(wallet, 'all').currencies[0]).toMatchObject({
      total: 4950,
      planned: 2950,
    });
    expect(structureReport(wallet, 'made').currencies[0]).toMatchObject({
      total: 2000,
      planned: 0,
    });
  });
});

describe('yearOverYearReport', () => {
  it('marks the years whose sums are partly a forecast', () => {
    const [report] = yearOverYearReport(wallet);
    // 2025 is all past; 2026 has the planned purchase and a coupon ahead; 2027 is all ahead.
    expect(report.years.map(({ year, forecast }) => [year, forecast])).toEqual([
      [2025, false],
      [2026, true],
      [2027, true],
    ]);
  });
});

describe('the PDF of these reports', () => {
  const active = { ...wallet, plan: { id: 'plan', name: 'План' } } as unknown as ActiveWallet;
  const summaryOf = (section: { summary?: { label: string; value: string; hint?: string }[] }) =>
    section.summary?.map(({ label, hint }) => [label, hint]);

  it('reads as the screen: the planned part, the bond’s state, the forecast years', () => {
    const portfolio = portfolioPdf(active, 'Усі ОВДП', portfolioReport(wallet, 'all'));
    expect(summaryOf(portfolio.sections[0])).toContainEqual([
      'З них заплановано',
      'Купівлі, яких ще не зроблено',
    ]);
    expect(portfolio.sections[2].rows[0][1]).toBe('до 01.03.2027');

    const redemptions = redemptionsPdf(active, 'Майбутні', redemptionsReport(wallet, 'upcoming'));
    expect(redemptions.sections[3].rows[0][4]).toBe('очікується · 3 з 5 шт заплановано');

    const years = yearsPdf(active, yearOverYearReport(wallet));
    const flows = years.sections.find(({ title }) => title.startsWith('Рух грошей по роках'));
    expect(flows?.rows.map(([year]) => year)).toEqual(['2025', '2026*', '2027*']);
    expect(flows?.note).toContain('прогноз');
  });
});
