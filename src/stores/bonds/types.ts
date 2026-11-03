import type { Bond } from '@/lib/portfolio/portfolio';

export type BondsState = {
  bonds: Bond[] | null;
  /** When NBU sent them, ms */
  updatedAt: number | null;
};
