import type { Bond, Operation } from '@/lib/portfolio/portfolio';
import { buildWallet } from '@/lib/portfolio/wallet';

import { positionReportSections } from './positionReportRows';

const bond: Bond = {
  isin: 'UA1',
  currency: 'UAH',
  nominal: 1000,
  rate: 10,
  issueDate: '2024-01-01',
  maturityDate: '2027-01-01',
  description: '',
  payments: [
    { date: '2026-01-01', type: 'redemption', amount: 500 },
    { date: '2027-01-01', type: 'redemption', amount: 500 },
  ],
};
const purchase: Operation = {
  id: 'buy',
  type: 'purchase',
  isin: bond.isin,
  currency: 'UAH',
  ovdp: bond,
  date: '2025-01-01',
  quantity: 2,
  amount: 1800,
  planned: false,
};

it('shows remaining cost after a partial redemption and a planned sale according to the selected scenario', () => {
  const sale: Operation = {
    ...purchase,
    id: 'sale',
    type: 'sale',
    date: '2026-07-01',
    quantity: 2,
    amount: 1000,
    planned: true,
  };
  const wallet = buildWallet([purchase, sale], new Map(), '2026-02-01');
  expect(positionReportSections(wallet, 'structure', null, null, 'all')).toEqual([]);
  const made = positionReportSections(wallet, 'structure', null, null, 'made');
  expect(
    made[0].rows.find((row) => row.label === 'Вартість утримуваних облігацій')?.value,
  ).toContain('900,00');
});
