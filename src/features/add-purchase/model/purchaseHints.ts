import { type Bond, bondChoices } from '@/entities/portfolio';
import { formatDate, formatMoney, formatTimeLeft, plural, round2 } from '@/shared/lib';
import { termOf } from './bondTerm';

/**
 * `success`: all is well; `info`: worth knowing, nothing wrong; `warning`: look before buying;
 * `error`: the purchase loses money, overpays a lot or was probably entered wrong.
 */
export type PurchaseHintTone = 'success' | 'info' | 'warning' | 'error';

export type PurchaseHint = { tone: PurchaseHintTone; text: string };

/** The worst tone among the hints and what it means for the purchase as a whole. */
export type PurchaseVerdict = { tone: Exclude<PurchaseHintTone, 'info'>; title: string };

/** A price per bond this far from the nominal is more likely a typo than a market price. */
const IMPLAUSIBLE_PRICE_RATIO = 0.5;
/**
 * Percentage points by which a yield may fall short before it is worth a warning, and before it is
 * a loss worth an error: against the coupon rate when overpaying, and against the key rate.
 */
const WARNING_GAP = 1;
const ERROR_GAP = 3;
/** Fewer bonds than this make a poor comparison. */
const MIN_PEERS = 3;

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
  error: 'Невигідна або ризикована купівля',
} as const satisfies Record<PurchaseVerdict['tone'], string>;

type Input = {
  bond: Bond;
  purchaseDate: string;
  pricePerBond: number;
  /** All payments minus the amount paid */
  netIncome: number;
  /** False while NBU has not published the redemption, so the payments fall short */
  isComplete: boolean;
  /** % a year; null when it cannot be computed */
  annualYield: number | null;
  /** NBU key policy rate, % a year; null until loaded */
  keyRate: number | null;
  /** The whole NBU catalog, to compare the coupon rate with */
  bonds: Bond[];
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : round2((sorted[middle - 1] + sorted[middle]) / 2);
}

/** The price against the nominal: a typo, a discount, or how much the premium costs. */
function priceHint({ bond, pricePerBond, annualYield }: Input): PurchaseHint | null {
  const { nominal, currency, rate } = bond;
  const ratio = pricePerBond / nominal;
  if (ratio < 1 - IMPLAUSIBLE_PRICE_RATIO || ratio > 1 + IMPLAUSIBLE_PRICE_RATIO) {
    return {
      tone: 'error',
      text: `Ціна 1 шт (${formatMoney(pricePerBond, currency)}) дуже далека від номіналу (${formatMoney(nominal, currency)}). Перевірте кількість і суму: сума — за всю купівлю.`,
    };
  }
  const gap = round2(Math.abs(pricePerBond - nominal));
  if (gap === 0) return null;
  const difference = formatMoney(gap, currency);
  if (pricePerBond < nominal) {
    const effect =
      annualYield !== null && annualYield > rate
        ? ` Через це річна дохідність (${annualYield}%) вища за ставку купону (${rate}%).`
        : '';
    return {
      tone: 'success',
      text: `Ціна 1 шт на ${difference} нижча за номінал: на погашенні ви отримаєте більше, ніж заплатили.${effect}`,
    };
  }
  // Some premium is the coupon accrued since the last payment, which the next coupon returns.
  const shortfall = annualYield === null ? 0 : round2(rate - annualYield);
  if (shortfall > WARNING_GAP) {
    return {
      tone: shortfall > ERROR_GAP ? 'error' : 'warning',
      text: `Ви переплачуєте ${difference} за 1 шт: річна дохідність (${annualYield}%) на ${shortfall} п.п. нижча за ставку купону (${rate}%).`,
    };
  }
  return {
    tone: 'info',
    text: `Ціна 1 шт на ${difference} вища за номінал: це переважно накопичений купон, його поверне найближча виплата.`,
  };
}

/** Losing money outright, whatever the rates. */
function lossHint({ bond, netIncome }: Input): PurchaseHint | null {
  if (netIncome >= 0) return null;
  return {
    tone: 'error',
    text: `Виплати не покриють купівлю: ви втратите ${formatMoney(-netIncome, bond.currency)}.`,
  };
}

/** The yield against the NBU key rate, which deposits and new bonds in hryvnia follow. */
function keyRateHint({ bond, annualYield, keyRate }: Input): PurchaseHint | null {
  if (bond.currency !== 'UAH' || annualYield === null || keyRate === null) return null;
  const versus = `облікову ставку НБУ (${keyRate}%)`;
  const gap = round2(keyRate - annualYield);
  if (gap > WARNING_GAP) {
    return {
      tone: gap > ERROR_GAP ? 'error' : 'warning',
      text: `Річна дохідність ${annualYield}% на ${gap} п.п. нижча за ${versus}: депозит чи інша ОВДП можуть дати більше.`,
    };
  }
  if (gap < -WARNING_GAP) {
    return { tone: 'success', text: `Річна дохідність ${annualYield}% вища за ${versus}.` };
  }
  return {
    tone: 'info',
    text: `Річна дохідність ${annualYield}% близька до облікової ставки НБУ (${keyRate}%).`,
  };
}

/** The coupon rate among bonds of the same currency and term in circulation on the purchase date. */
function peersHint({ bond, purchaseDate, bonds }: Input): PurchaseHint | null {
  const term = termOf(bond, purchaseDate);
  const peers = bondChoices(bonds, '', purchaseDate).filter(
    (peer) =>
      peer.isin !== bond.isin &&
      peer.issueDate <= purchaseDate &&
      peer.currency === bond.currency &&
      termOf(peer, purchaseDate) === term,
  );
  if (peers.length < MIN_PEERS) return null;
  const rates = peers.map((peer) => peer.rate);
  const best = Math.max(...rates);
  const middle = median(rates);
  const among = `серед ${peers.length} ${plural(peers.length, 'іншої ОВДП', 'інших ОВДП', 'інших ОВДП')} у ${bond.currency} зі строком ${TERM_PHRASES[term]}`;
  if (bond.rate >= best) {
    return { tone: 'success', text: `Ставка купону ${bond.rate}% — найвища ${among}.` };
  }
  if (bond.rate >= middle) {
    return {
      tone: 'success',
      text: `Ставка купону ${bond.rate}% не нижча за середню (${middle}%) ${among}. Найвища — ${best}%.`,
    };
  }
  return {
    tone: 'warning',
    text: `Ставка купону ${bond.rate}% нижча за середню (${middle}%) ${among}. Найвища — ${best}%.`,
  };
}

/** What can go wrong besides the price: missing data, a long lock-up, another currency. */
function riskHints({ bond, purchaseDate, isComplete }: Input): PurchaseHint[] {
  const hints: PurchaseHint[] = [];
  if (!isComplete) {
    hints.push({
      tone: 'warning',
      text: 'НБУ ще не опублікував погашення цієї ОВДП, тому дохідність не пораховано.',
    });
  }
  if (termOf(bond, purchaseDate) === 'long') {
    hints.push({
      tone: 'warning',
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

/** What makes the purchase better or worse, in plain words, the most serious first. */
export function purchaseHints(input: Input): PurchaseHint[] {
  return [
    lossHint(input),
    priceHint(input),
    keyRateHint(input),
    peersHint(input),
    ...riskHints(input),
  ]
    .filter((hint): hint is PurchaseHint => hint !== null)
    .sort((a, b) => SEVERITY[b.tone] - SEVERITY[a.tone]);
}

/** The purchase as a whole takes its worst hint's tone; with only neutral hints there is none. */
export function purchaseVerdict(hints: PurchaseHint[]): PurchaseVerdict | null {
  const worst = hints.reduce<PurchaseHintTone>(
    (current, hint) => (SEVERITY[hint.tone] > SEVERITY[current] ? hint.tone : current),
    'info',
  );
  return worst === 'info' ? null : { tone: worst, title: VERDICT_TITLES[worst] };
}
