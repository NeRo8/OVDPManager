import { type ActiveWallet, type Bond, type Purchase, buildWallet } from '@/entities/portfolio';

/**
 * A wallet with purchases made and planned, for the reports' tests: two bonds bought in January
 * 2025, three more planned for June 2026, today 1 March 2026.
 */

export const bond: Bond = {
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

export const plannedWallet = buildWallet(
  [purchase('made', '2025-01-10', 2, 2000), purchase('planned', '2026-06-01', 3, 2950)],
  new Map([[bond.isin, bond]]),
  '2026-03-01',
);

/** The same wallet as the screens get it, with a plan to name in a PDF. */
export const plannedActiveWallet = {
  ...plannedWallet,
  plan: { id: 'plan', name: 'План' },
} as unknown as ActiveWallet;
