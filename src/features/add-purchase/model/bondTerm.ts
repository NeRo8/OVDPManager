import { type Bond, maturesWithin } from '@/entities/portfolio';

/** Time left until maturity: up to a year, one to three years, longer. */
export type BondTerm = 'all' | 'short' | 'medium' | 'long';

export function termOf(bond: Bond, today: string): Exclude<BondTerm, 'all'> {
  if (maturesWithin(bond, today, 12)) return 'short';
  if (maturesWithin(bond, today, 36)) return 'medium';
  return 'long';
}
