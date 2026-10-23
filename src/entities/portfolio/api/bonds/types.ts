import type { Bond } from '../../model/portfolio';

export type BondsState = {
  bonds: Bond[] | null;
  /** When NBU sent them, ms */
  updatedAt: number | null;
};
