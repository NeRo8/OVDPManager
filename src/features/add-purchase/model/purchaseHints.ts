import { ANNUAL_YIELD_RANGE, type Bond, canBuyOn } from '@/entities/portfolio';
import { addMonthsISO, formatDate, formatMoney, formatTimeLeft, round2 } from '@/shared/lib';
import { termOf } from './bondTerm';

/**
 * `success`: all is well; `info`: worth knowing, nothing wrong; `warning`: look before buying;
 * `error`: the purchase loses money or yields far less than the key rate.
 */
export type PurchaseHintTone = 'success' | 'info' | 'warning' | 'error';

export type PurchaseHint = { tone: PurchaseHintTone; text: string };

/** What the hints mean for the purchase as a whole. */
export type PurchaseVerdict = { tone: Exclude<PurchaseHintTone, 'info'>; title: string };

export type PurchaseAssessment = { verdict: PurchaseVerdict | null; hints: PurchaseHint[] };

/**
 * No bond sells at a higher annual yield, %: a purchase above it, or beyond what `annualYield`
 * computes, is more likely a typo in the amount or the quantity.
 */
const MAX_PLAUSIBLE_YIELD = 40;
/**
 * Percentage points by which the annual yield may fall short of the key rate or of new bonds
 * before it is worth a warning, and of the key rate before the purchase is a poor one.
 */
const WARNING_GAP = 1;
const ERROR_GAP = 3;
/**
 * Bonds placed this many months before the purchase show what the market pays: a new bond's
 * coupon rate is close to the yield on the day it was placed.
 */
const NEW_BOND_MONTHS = 12;
/** Fewer new bonds than this make a poor comparison. */
const MIN_NEW_BONDS = 2;

const TERM_PHRASES = {
  short: 'до 1 року',
  medium: '1–3 роки',
  long: 'понад 3 роки',
} as const;

const SEVERITY = { info: 0, success: 1, warning: 2, error: 3 } as const satisfies Record<
  PurchaseHintTone,
  number
>;

const VERDICT_TITLES = {
  success: 'Вигідна купівля',
  warning: 'Є на що звернути увагу',
  error: 'Невигідна купівля',
} as const satisfies Record<PurchaseVerdict['tone'], string>;

const CHECK_AMOUNT: PurchaseVerdict = { tone: 'warning', title: 'Перевірте суму' };

type Input = {
  bond: Bond;
  purchaseDate: string;
  pricePerBond: number;
  /** All payments minus the amount paid; null while the payments are incomplete */
  netIncome: number | null;
  /** False while NBU has not published the redemption, so the payments fall short */
  isComplete: boolean;
  /** % a year; null when it cannot be computed or lies beyond `ANNUAL_YIELD_RANGE` */
  annualYield: number | null;
  /** NBU key policy rate, % a year; null until loaded */
  keyRate: number | null;
  /** The whole NBU catalog, to find the bonds placed lately */
  bonds: Bond[];
};

type YieldInput = Pick<Input, 'annualYield' | 'netIncome' | 'isComplete'>;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : round2((sorted[middle - 1] + sorted[middle]) / 2);
}

/**
 * «Річна дохідність» in words, also when it lies beyond what `annualYield` computes: with every
 * payment known, a null yield is above the range when the purchase earns and below it when it
 * loses. «—» while the payments are incomplete.
 */
export function annualYieldText({ annualYield, netIncome, isComplete }: YieldInput): string {
  if (annualYield !== null) return `${annualYield}%`;
  if (!isComplete || netIncome === null) return '—';
  return netIncome >= 0
    ? `понад ${ANNUAL_YIELD_RANGE.highest}%`
    : `нижче ${ANNUAL_YIELD_RANGE.lowest}%`;
}

/** A yield no market price gives: most likely a typo in the amount or the quantity. */
function isImplausible({ annualYield, isComplete }: Input): boolean {
  if (!isComplete) return false;
  return annualYield === null || annualYield > MAX_PLAUSIBLE_YIELD;
}

function implausibleHint(input: Input): PurchaseHint {
  const { bond, pricePerBond, netIncome } = input;
  const price = `${formatMoney(pricePerBond, bond.currency)} за 1 шт`;
  const check =
    'на ринку ОВДП так не продаються. Перевірте кількість і суму: сума — за всю купівлю.';
  if (netIncome !== null && netIncome < 0) {
    return {
      tone: 'warning',
      text: `За ${price} ви втратите ${formatMoney(-netIncome, bond.currency)}: ${check}`,
    };
  }
  return {
    tone: 'warning',
    text: `За ${price} річна дохідність була б ${annualYieldText(input)}: ${check} Якщо все правильно, купівля дуже вигідна.`,
  };
}

/** Losing money outright, whatever the rates. */
function lossHint({ bond, netIncome }: Input): PurchaseHint | null {
  if (netIncome === null || netIncome >= 0) return null;
  return {
    tone: 'error',
    text: `Виплати не покриють купівлю: ви втратите ${formatMoney(-netIncome, bond.currency)}.`,
  };
}

/** The yield against the NBU key rate, which deposits and new bonds in hryvnia follow. */
function keyRateHint({ bond, annualYield, keyRate }: Input): PurchaseHint | null {
  if (bond.currency !== 'UAH' || annualYield === null || keyRate === null) return null;
  const gap = round2(keyRate - annualYield);
  if (gap > WARNING_GAP) {
    return {
      tone: gap > ERROR_GAP ? 'error' : 'warning',
      text: `Річна дохідність ${annualYield}% на ${gap} п.п. нижча за облікову ставку НБУ (${keyRate}%): депозит чи нова ОВДП можуть дати більше.`,
    };
  }
  return {
    tone: 'success',
    text:
      gap < 0
        ? `Річна дохідність ${annualYield}% вища за облікову ставку НБУ (${keyRate}%).`
        : `Річна дохідність ${annualYield}% близька до облікової ставки НБУ (${keyRate}%).`,
  };
}

/**
 * The yield against the coupon rates of bonds of the same currency and term placed in the months
 * before the purchase: what buying a new bond instead would pay.
 */
function newBondsHint({ bond, purchaseDate, annualYield, bonds }: Input): PurchaseHint | null {
  if (annualYield === null) return null;
  const term = termOf(bond, purchaseDate);
  const since = addMonthsISO(purchaseDate, -NEW_BOND_MONTHS);
  const newBonds = bonds.filter(
    (other) =>
      other.isin !== bond.isin &&
      other.currency === bond.currency &&
      other.issueDate > since &&
      other.issueDate <= purchaseDate &&
      canBuyOn(other, purchaseDate) &&
      termOf(other, purchaseDate) === term,
  );
  if (newBonds.length < MIN_NEW_BONDS) return null;
  const middle = median(newBonds.map((other) => other.rate));
  const among = `${newBonds.length} ОВДП у ${bond.currency} зі строком ${TERM_PHRASES[term]}, розміщених за останні ${NEW_BOND_MONTHS} місяців`;
  const gap = round2(middle - annualYield);
  if (gap > WARNING_GAP) {
    return {
      tone: 'warning',
      text: `Річна дохідність ${annualYield}% на ${gap} п.п. нижча за середню ставку купону (${middle}%) ${among}: нова ОВДП може дати більше.`,
    };
  }
  return {
    tone: 'success',
    text:
      gap < 0
        ? `Річна дохідність ${annualYield}% вища за середню ставку купону (${middle}%) ${among}.`
        : `Річна дохідність ${annualYield}% близька до середньої ставки купону (${middle}%) ${among}.`,
  };
}

/**
 * Why the price differs from the nominal. The difference is part of the annual yield, so it is
 * explained, not judged: a discount mostly makes up for a coupon below the market's.
 */
function priceHint({ bond, pricePerBond, annualYield }: Input): PurchaseHint | null {
  const gap = round2(Math.abs(pricePerBond - bond.nominal));
  if (gap === 0) return null;
  const difference = formatMoney(gap, bond.currency);
  const counted =
    annualYield === null ? '' : ` Різницю вже враховано в річній дохідності (${annualYield}%).`;
  return {
    tone: 'info',
    text:
      pricePerBond < bond.nominal
        ? `Ціна 1 шт на ${difference} нижча за номінал: цю різницю ви отримаєте на погашенні.${counted}`
        : `Ціна 1 шт на ${difference} вища за номінал: на погашенні ви отримаєте лише номінал, а накопичений купон у ціні поверне найближча виплата.${counted}`,
  };
}

/** What else to know: missing data, a long lock-up, another currency. */
function otherHints({ bond, purchaseDate, isComplete }: Input): PurchaseHint[] {
  const hints: PurchaseHint[] = [];
  if (!isComplete) {
    hints.push({
      tone: 'warning',
      text: 'НБУ ще не опублікував погашення цієї ОВДП, тому річну дохідність не пораховано.',
    });
  }
  if (termOf(bond, purchaseDate) === 'long') {
    hints.push({
      tone: 'info',
      text: `Гроші будуть в ОВДП до ${formatDate(bond.maturityDate)} (${formatTimeLeft(purchaseDate, bond.maturityDate)}). Продати раніше можна лише за ринковою ціною, і вона може бути нижчою за вашу.`,
    });
  }
  if (bond.currency !== 'UAH') {
    hints.push({
      tone: 'info',
      text: `Виплати — у ${bond.currency}. Їхня вартість у гривні залежить від курсу, а облікова ставка НБУ до них не застосовується.`,
    });
  }
  return hints;
}

/** The purchase takes its worst hint's tone; with only neutral hints there is no verdict. */
function verdictOf(hints: PurchaseHint[]): PurchaseVerdict | null {
  const worst = hints.reduce<PurchaseHintTone>(
    (current, hint) => (SEVERITY[hint.tone] > SEVERITY[current] ? hint.tone : current),
    'info',
  );
  return worst === 'info' ? null : { tone: worst, title: VERDICT_TITLES[worst] };
}

/**
 * How good the purchase is, judged by its annual yield: against the key rate for hryvnia bonds
 * and against the bonds placed lately. The price and the term are explained, not judged. A yield
 * no market gives asks to check the amount instead of being compared.
 */
export function assessPurchase(input: Input): PurchaseAssessment {
  if (isImplausible(input)) return { verdict: CHECK_AMOUNT, hints: [implausibleHint(input)] };
  const hints = [
    lossHint(input),
    keyRateHint(input),
    newBondsHint(input),
    priceHint(input),
    ...otherHints(input),
  ]
    .filter((hint): hint is PurchaseHint => hint !== null)
    .sort((a, b) => SEVERITY[b.tone] - SEVERITY[a.tone]);
  return { verdict: verdictOf(hints), hints };
}
