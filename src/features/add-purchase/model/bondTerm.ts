import type { Bond } from '@/entities/portfolio';
import { addMonthsISO } from '@/shared/lib';

/** Time left until maturity: up to a year, one to three years, longer. */
export type BondTerm = 'all' | 'short' | 'medium' | 'long';

export function termOf(bond: Bond, today: string): Exclude<BondTerm, 'all'> {
  if (bond.maturityDate <= addMonthsISO(today, 12)) return 'short';
  if (bond.maturityDate <= addMonthsISO(today, 36)) return 'medium';
  return 'long';
}
