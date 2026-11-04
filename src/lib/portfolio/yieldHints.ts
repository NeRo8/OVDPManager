import { formatPercent, formatRateNumber } from '@/utils/format';
import { round2 } from '@/utils/number';

import type { Hint } from './hints';
import { type NewBondsRate, newBondsLabel } from './market';
import type { Currency } from './portfolio';

/** Percentage points by which an annual yield may fall short of the market's before a warning. */
const WARNING_GAP = 1;

/**
 * An annual yield against the NBU key rate, which deposits and new bonds in hryvnia follow; null
 * for another currency or without the rate. A shortfall past `errorGap`, when given, is an error.
 */
export function keyRateHint(
  annualYield: number,
  keyRate: number | null,
  currency: Currency,
  errorGap?: number,
): Hint | null {
  if (currency !== 'UAH' || keyRate === null) return null;
  const gap = round2(keyRate - annualYield);
  if (gap > WARNING_GAP) {
    return {
      tone: errorGap !== undefined && gap > errorGap ? 'error' : 'warning',
      text: `Річна дохідність ${formatPercent(annualYield)} на ${formatRateNumber(gap)} п.п. нижча за облікову ставку НБУ (${formatPercent(keyRate)}): депозит чи нова ОВДП можуть дати більше.`,
    };
  }
  return {
    tone: 'success',
    text:
      gap < 0
        ? `Річна дохідність ${formatPercent(annualYield)} вища за облікову ставку НБУ (${formatPercent(keyRate)}).`
        : `Річна дохідність ${formatPercent(annualYield)} близька до облікової ставки НБУ (${formatPercent(keyRate)}).`,
  };
}

/** An annual yield against what new bonds pay: what buying one instead would bring. */
export function newBondsHint(
  annualYield: number,
  newBonds: NewBondsRate | null,
  currency: Currency,
): Hint | null {
  if (!newBonds) return null;
  const rate = `(${formatPercent(newBonds.rate)}) ${newBondsLabel(newBonds, currency)}`;
  const gap = round2(newBonds.rate - annualYield);
  if (gap > WARNING_GAP) {
    return {
      tone: 'warning',
      text: `Річна дохідність ${formatPercent(annualYield)} на ${formatRateNumber(gap)} п.п. нижча за медіанну ставку купону ${rate}: нова облігація може дати більше.`,
    };
  }
  return {
    tone: 'success',
    text:
      gap < 0
        ? `Річна дохідність ${formatPercent(annualYield)} вища за медіанну ставку купону ${rate}.`
        : `Річна дохідність ${formatPercent(annualYield)} близька до медіанної ставки купону ${rate}.`,
  };
}

/**
 * Why a hryvnia yield is not set against the key rate: NBU could not be asked for it. Neutral, as
 * a rate that did not load says nothing about the purchase.
 */
export function keyRateFailedHint(keyRateFailed: boolean, currency: Currency): Hint | null {
  if (!keyRateFailed || currency !== 'UAH') return null;
  return {
    tone: 'info',
    text: 'Не вдалося завантажити облікову ставку НБУ, тож порівняння з нею немає. Спробуйте пізніше.',
  };
}
