import { buildWallet } from '@/entities/portfolio';

import { bondReport } from '../bondReport';
import { portfolioReport } from '../portfolioReport';
import { bondPdf, portfolioPdf } from '../reportPdf';

import { bond, plannedActiveWallet, plannedWallet } from './plannedWallet';

it('keeps the selected bond, weighted key rate and yearly cash flows in the report and PDF', () => {
  const item = plannedWallet.positions[0];
  const report = bondReport(plannedWallet, item, () => 15);
  expect(report.keyRateAtPurchase).toBe(15);
  expect(report.money?.years.map(({ year }) => year)).toEqual([2025, 2026, 2027]);
  const pdf = bondPdf(plannedActiveWallet, report);
  expect(pdf.scope).toBe(bond.isin);
  expect(pdf.sections.find(({ title }) => title === 'Купівлі')?.rows).toHaveLength(2);
  expect(
    pdf.sections
      .find(({ title }) => title === 'Параметри випуску')
      ?.summary?.map(({ label }) => label),
  ).toContain('Перший купон на 1 шт');
});

it('preserves an unknown bond without inventing NBU data', () => {
  const wallet = buildWallet(plannedWallet.purchases, new Map(), plannedWallet.today);
  const report = bondReport(wallet, wallet.positions[0], () => null);
  expect(report.item.bond).toBeUndefined();
  const pdf = bondPdf({ ...plannedActiveWallet, ...wallet }, report);
  expect(pdf.sections[0].note).toContain('немає в даних НБУ');
});

it('shows an unavailable return as a dash in both PDFs', () => {
  const purchase = { ...plannedWallet.purchases[0], amount: 0.001, quantity: 1 };
  const wallet = buildWallet([purchase], new Map([[bond.isin, bond]]), plannedWallet.today);
  const activeWallet = { ...plannedActiveWallet, ...wallet };
  const bondDocument = bondPdf(activeWallet, bondReport(wallet, wallet.positions[0], () => null));
  const portfolioDocument = portfolioPdf(activeWallet, 'Усі ОВДП', portfolioReport(wallet, 'all'));

  for (const document of [bondDocument, portfolioDocument]) {
    const summary = document.sections.find(({ title }) => title.startsWith('Підсумок'));
    expect(summary?.summary?.find(({ label }) => label === 'Дохідність за весь строк')?.value).toBe(
      '—',
    );
  }
});
