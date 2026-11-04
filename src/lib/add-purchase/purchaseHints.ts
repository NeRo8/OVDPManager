import { type Hint, type Verdict, sortHints, worstTone } from '@/lib/portfolio/hints';
import { MAX_PLAUSIBLE_YIELD, maturityTerm, newBondsRate } from '@/lib/portfolio/market';
import { type Bond, plannedByDate } from '@/lib/portfolio/portfolio';
import { ANNUAL_YIELD_RANGE } from '@/lib/portfolio/yield';
import { keyRateFailedHint, keyRateHint, newBondsHint } from '@/lib/portfolio/yieldHints';
import { formatDate, formatTimeLeft } from '@/utils/date';
import { formatMoney, formatPercent } from '@/utils/format';
import { round2 } from '@/utils/number';

export type PurchaseAssessment = { verdict: Verdict | null; hints: Hint[] };

/** Percentage points below the key rate past which the purchase is a poor one. */
const ERROR_GAP = 3;
const VERDICT_TITLES = {
  success: 'Вигідна купівля',
  warning: 'Є на що звернути увагу',
  error: 'Невигідна купівля',
} as const satisfies Record<Verdict['tone'], string>;

const CHECK_AMOUNT: Verdict = { tone: 'warning', title: 'Перевірте суму' };

type Input = {
  bond: Bond;
  date: string;
  /** Today, to avoid projecting currently known market rates into the future. */
  today: string;
  pricePerBond: number;
  /** All payments minus the amount paid; null while the payments are incomplete */
  netIncome: number | null;
  /** False while NBU has not published the redemption, so the payments fall short */
  isComplete: boolean;
  /** % a year; null when it cannot be computed or lies beyond `ANNUAL_YIELD_RANGE` */
  annualYield: number | null;
  /** NBU key policy rate, % a year; null until loaded */
  keyRate: number | null;
  /** The key rate is missing as NBU could not be asked for it */
  keyRateFailed: boolean;
  /** The whole NBU catalog, to find the bonds placed lately */
  bonds: Bond[];
};

type YieldInput = Pick<Input, 'annualYield' | 'netIncome' | 'isComplete'>;

/**
 * «Річна дохідність» in words, also when it lies beyond what `annualYield` computes: with every
 * payment known, a null yield is above the range when the purchase earns and below it when it
 * loses. «—» while the payments are incomplete.
 */
export function annualYieldText({ annualYield, netIncome, isComplete }: YieldInput): string {
  if (annualYield !== null) return formatPercent(annualYield);
  if (!isComplete || netIncome === null) return '—';
  return netIncome >= 0
    ? `понад ${formatPercent(ANNUAL_YIELD_RANGE.highest)}`
    : `нижче ${formatPercent(ANNUAL_YIELD_RANGE.lowest)}`;
}

/** A yield no market price gives: most likely a typo in the amount or the quantity. */
function isImplausible({ annualYield, isComplete }: Input): boolean {
  if (!isComplete) return false;
  return annualYield === null || annualYield > MAX_PLAUSIBLE_YIELD;
}

function implausibleHint(input: Input): Hint {
  const { bond, pricePerBond, netIncome } = input;
  const price = `${formatMoney(pricePerBond, bond.currency)} за 1 шт`;
  const check =
    'на ринку облігації так не продаються. Перевірте кількість і суму: сума — за всю купівлю.';
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
function lossHint({ bond, netIncome }: Input): Hint | null {
  if (netIncome === null || netIncome >= 0) return null;
  return {
    tone: 'error',
    text: `Виплати не покриють купівлю: ви втратите ${formatMoney(-netIncome, bond.currency)}.`,
  };
}

/**
 * Why the price differs from the nominal. The difference is part of the annual yield, so it is
 * explained, not judged: a discount mostly makes up for a coupon below the market's.
 */
function priceHint({ bond, pricePerBond, annualYield }: Input): Hint | null {
  const gap = round2(Math.abs(pricePerBond - bond.nominal));
  if (gap === 0) return null;
  const difference = formatMoney(gap, bond.currency);
  const counted =
    annualYield === null
      ? ''
      : ` Різницю вже враховано в річній дохідності (${formatPercent(annualYield)}).`;
  return {
    tone: 'info',
    text:
      pricePerBond < bond.nominal
        ? `Ціна 1 шт на ${difference} нижча за номінал: цю різницю ви отримаєте на погашенні.${counted}`
        : `Ціна 1 шт на ${difference} вища за номінал: на погашенні ви отримаєте лише номінал, а накопичений купон у ціні поверне найближча виплата.${counted}`,
  };
}

/** What else to know: missing data, a long lock-up, another currency. */
function otherHints({ bond, date, isComplete }: Input): Hint[] {
  const hints: Hint[] = [];
  if (!isComplete) {
    hints.push({
      tone: 'warning',
      text: 'НБУ ще не опублікував погашення цієї облігації, тому річну дохідність не пораховано.',
    });
  }
  if (maturityTerm(bond, date) === 'long') {
    hints.push({
      tone: 'info',
      text: `Гроші будуть в облігації до ${formatDate(bond.maturityDate)} (${formatTimeLeft(date, bond.maturityDate)}). Продати раніше можна лише за ринковою ціною, і вона може бути нижчою за вашу.`,
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

/**
 * Nothing to set the yield against: no new bonds like this one, and in hryvnia no key rate either,
 * saying why when it did not load.
 */
function noBenchmarkHint({ bond, keyRate, keyRateFailed }: Input): Hint | null {
  if (bond.currency !== 'UAH') {
    return { tone: 'info', text: 'Немає доступних ринкових орієнтирів для порівняння дохідності.' };
  }
  if (keyRate !== null) return null;
  return {
    tone: 'info',
    text: keyRateFailed
      ? 'Не вдалося завантажити облікову ставку НБУ, а нових облігацій для порівняння недостатньо. Спробуйте пізніше.'
      : 'Облікова ставка НБУ недоступна, а нових облігацій для порівняння недостатньо.',
  };
}

/**
 * What the yield could not be set against: without new bonds one hint says what is missing; with
 * them only a key rate that did not load may be. Nothing while there is no yield to compare.
 */
function missingBenchmarkHint(input: Input, hasNewBonds: boolean): Hint | null {
  if (input.annualYield === null) return null;
  if (hasNewBonds) return keyRateFailedHint(input.keyRateFailed, input.bond.currency);
  return noBenchmarkHint(input);
}

/** The purchase takes its worst hint's tone; with only neutral hints there is no verdict. */
function verdictOf(hints: Hint[]): Verdict | null {
  const worst = worstTone(hints);
  return worst === 'info' ? null : { tone: worst, title: VERDICT_TITLES[worst] };
}

/**
 * How good the purchase is, judged by its annual yield: against the key rate for hryvnia bonds
 * and against the bonds placed lately. The price and the term are explained, not judged. A yield
 * no market gives asks to check the amount instead of being compared.
 */
export function assessPurchase(input: Input): PurchaseAssessment {
  if (isImplausible(input)) return { verdict: CHECK_AMOUNT, hints: [implausibleHint(input)] };
  const { bond, date, today, annualYield, keyRate, bonds } = input;
  const isPlanned = plannedByDate(date, today);
  // A planned purchase is compared with what is known today.
  const comparisonDate = isPlanned ? today : date;
  const market = newBondsRate(bond, comparisonDate, bonds);
  const hints = sortHints([
    lossHint(input),
    annualYield === null ? null : keyRateHint(annualYield, keyRate, bond.currency, ERROR_GAP),
    annualYield === null ? null : newBondsHint(annualYield, market, bond.currency),
    priceHint(input),
    missingBenchmarkHint(input, market !== null),
    isPlanned && annualYield !== null
      ? {
          tone: 'info',
          text: 'Для запланованої купівлі порівняння використовує сьогоднішні ставки; до дати купівлі вони можуть змінитися.',
        }
      : null,
    ...otherHints(input),
  ]);
  return { verdict: verdictOf(hints), hints };
}
