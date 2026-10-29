import { addMonthsISO, round2 } from '@/shared/lib';
import { type Bond, canBuyOn, maturesWithin } from './portfolio';

/** Time left to maturity: up to a year, one to three years, longer. */
export type MaturityTerm = 'short' | 'medium' | 'long';

export function maturityTerm(bond: Pick<Bond, 'maturityDate'>, date: string): MaturityTerm {
  if (maturesWithin(bond, date, 12)) return 'short';
  if (maturesWithin(bond, date, 36)) return 'medium';
  return 'long';
}

/**
 * Bonds placed this many months before a date show what the market pays on it: a new bond's
 * coupon rate is close to the yield on the day it was placed.
 */
export const NEW_BOND_MONTHS = 12;
/** Fewer new bonds than this make a poor comparison. */
const MIN_NEW_BONDS = 2;

/**
 * No bond sells at a higher annual yield, %: a price that gives more, or more than `annualYield`
 * computes, is more likely a typo.
 */
export const MAX_PLAUSIBLE_YIELD = 40;

/** What buying a new bond like `bond` pays on a date. */
export type NewBondsRate = {
  /** The median coupon rate, % a year */
  rate: number;
  /** How many bonds it comes from */
  count: number;
  term: MaturityTerm;
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : round2((sorted[middle - 1] + sorted[middle]) / 2);
}

/**
 * The coupon rate of the other bonds of `bond`'s currency and term placed in the
 * `NEW_BOND_MONTHS` before `date` and still for sale on it; null when there are too few.
 */
export function newBondsRate(bond: Bond, date: string, bonds: Bond[]): NewBondsRate | null {
  const term = maturityTerm(bond, date);
  const since = addMonthsISO(date, -NEW_BOND_MONTHS);
  const newBonds = bonds.filter(
    (other) =>
      other.isin !== bond.isin &&
      other.currency === bond.currency &&
      other.issueDate > since &&
      other.issueDate <= date &&
      canBuyOn(other, date) &&
      maturityTerm(other, date) === term,
  );
  if (newBonds.length < MIN_NEW_BONDS) return null;
  return { rate: median(newBonds.map((other) => other.rate)), count: newBonds.length, term };
}

const TERM_PHRASES = {
  short: 'до 1 року',
  medium: '1–3 роки',
  long: 'понад 3 роки',
} as const satisfies Record<MaturityTerm, string>;

/** The new bonds in words, after «ставка купону»: «12 ОВДП у UAH зі строком 1–3 роки, …». */
export function newBondsLabel({ count, term }: NewBondsRate, currency: Bond['currency']): string {
  return `${count} ОВДП у ${currency} зі строком ${TERM_PHRASES[term]}, розміщених за останні ${NEW_BOND_MONTHS} місяців`;
}
