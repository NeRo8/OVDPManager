import type { Operation } from '@/lib/portfolio/portfolio';
import { buildWallet } from '@/lib/portfolio/wallet';

import { scopedWallet } from './reportScope';

it('filters operations and their resulting positions together', () => {
  const first: Operation = {
    id: '1',
    type: 'purchase',
    isin: 'UA1',
    currency: 'UAH',
    ovdp: null,
    date: '2025-01-01',
    quantity: 1,
    amount: 1000,
    planned: false,
  };
  const second: Operation = { ...first, id: '2', isin: 'UA2', currency: 'USD' };
  const wallet = buildWallet([first, second], new Map(), '2026-01-01');
  const scoped = scopedWallet(wallet, { currency: 'UAH', isins: ['UA1'] });
  expect(scoped.operations.map((operation) => operation.id)).toEqual(['1']);
  expect(scoped.positions.map(({ position }) => position.isin)).toEqual(['UA1']);
  expect(scoped.operationEvents.map((operation) => operation.id)).toEqual(['1']);
});

it('does not widen a report when the selected bond is no longer present', () => {
  const purchase: Operation = {
    id: '1',
    type: 'purchase',
    isin: 'UA1',
    currency: 'UAH',
    ovdp: null,
    date: '2025-01-01',
    quantity: 1,
    amount: 1000,
    planned: false,
  };
  const wallet = buildWallet([purchase], new Map(), '2026-01-01');
  expect(scopedWallet(wallet, { currency: 'UAH', isins: ['UA2'] }).positions).toEqual([]);
});
