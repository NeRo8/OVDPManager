import type { MaturityTerm } from '@/entities/portfolio';

/** The picker's term filter: any term, or one of the terms to maturity. */
export type BondTerm = 'all' | MaturityTerm;
