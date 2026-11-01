import { type Bond, type Purchase, buildWallet } from '@/entities/portfolio';

import { sortWalletPositions } from '../walletOrder';

const today = '2026-10-31';

const bondOf = (isin: string, maturityDate: string): Bond => ({
  isin,
  nominal: 1000,
  rate: 16,
  currency: 'UAH',
  issueDate: '2024-01-01',
  maturityDate,
  description: '',
  payments: [{ date: maturityDate, type: 'redemption', amount: 1000 }],
});

const bonds = [
  bondOf('UA4000000001', '2028-05-01'),
  bondOf('UA4000000002', '2027-02-01'),
  bondOf('UA4000000003', '2025-06-01'),
  bondOf('UA4000000004', '2026-03-01'),
  bondOf('UA4000000005', '2027-02-01'),
];

const purchaseOf = (isin: string, purchaseDate = '2024-02-01'): Purchase => ({
  id: isin,
  isin,
  purchaseDate,
  amount: 1000,
  quantity: 1,
  currency: 'UAH',
});

describe('sortWalletPositions', () => {
  it('puts the nearest maturity first, the redeemed after, the latest of them first', () => {
    const purchases = [
      // Missing from the NBU data: last.
      purchaseOf('UA4000000099'),
      ...bonds.map((bond) => purchaseOf(bond.isin)),
      // Only planned: among those still to mature, by its maturity.
      purchaseOf('UA4000000006', '2026-12-01'),
    ];
    const byIsin = new Map(
      [...bonds, bondOf('UA4000000006', '2026-12-15')].map((bond) => [bond.isin, bond]),
    );
    const { positions } = buildWallet(purchases, byIsin, today);
    expect(sortWalletPositions(positions).map(({ position }) => position.isin.slice(-2))).toEqual([
      '06',
      '02',
      '05',
      '01',
      '04',
      '03',
      '99',
    ]);
  });
});
