import type { BondSort, BondTerm } from '@/features/add-purchase';

export const TERM_LABELS: Record<BondTerm, string> = {
  all: 'Усі строки',
  short: 'До 1 року',
  medium: '1–3 роки',
  long: 'Понад 3 роки',
};

export const SORT_LABELS: Record<BondSort, string> = {
  maturity: 'За погашенням',
  rate: 'За ставкою',
};
