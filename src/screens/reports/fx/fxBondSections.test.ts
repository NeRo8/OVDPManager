import type { Bond, Operation } from '@/lib/portfolio/portfolio';
import { buildWallet } from '@/lib/portfolio/wallet';
import { formatMoney } from '@/utils/format';

import { fxBondSections } from './fxBondSections';
import { convertFxEvents, fxEvents } from './fxReport';

const bond: Bond = {
  isin: 'UA1',
  currency: 'UAH',
  nominal: 1000,
  rate: 10,
  issueDate: '2024-01-01',
  maturityDate: '2027-01-01',
  description: '',
  payments: [],
};
const purchase: Operation = {
  id: 'purchase',
  type: 'purchase',
  date: '2025-01-01',
  currency: 'UAH',
  isin: bond.isin,
  ovdp: bond,
  quantity: 2,
  amount: 2000,
  planned: false,
};
const rates = { '2025-01-01': 40, '2025-06-01': 50 };

describe('fxBondSections', () => {
  it('shows the result of a fully sold bond using each operation’s exchange rate', () => {
    const sale: Operation = {
      ...purchase,
      id: 'sale',
      type: 'sale',
      date: '2025-06-01',
      amount: 3000,
    };
    const wallet = buildWallet([purchase, sale], new Map(), '2025-07-01');
    const [section] = fxBondSections(
      wallet,
      convertFxEvents(fxEvents(wallet), rates),
      '2025-07-01',
      'USD',
    );
    expect(section.rows).toEqual([
      { label: 'Вкладено за курсами купівель', value: formatMoney(50, 'USD') },
      { label: 'Отримано за курсами надходжень', value: formatMoney(60, 'USD') },
      { label: 'Результат закритої позиції', value: formatMoney(10, 'USD') },
    ]);
  });

  it('does not treat a partial or unconfirmed sale as a closed position', () => {
    const sale: Operation = {
      ...purchase,
      id: 'sale',
      type: 'sale',
      date: '2025-06-01',
      quantity: 1,
      amount: 1500,
    };
    for (const planned of [false, true]) {
      const wallet = buildWallet([purchase, { ...sale, planned }], new Map(), '2025-07-01');
      const [section] = fxBondSections(
        wallet,
        convertFxEvents(fxEvents(wallet), rates),
        '2025-07-01',
        'USD',
      );
      expect(section.rows.find((row) => row.label === 'Результат закритої позиції')?.value).toBe(
        '—',
      );
    }
  });
});
