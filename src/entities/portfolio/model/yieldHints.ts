import { round2 } from '@/shared/lib';
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

/** An annual yield against what new bonds pay: what buying one instead would bring. */
export function newBondsHint(
  annualYield: number,
  newBonds: NewBondsRate | null,
  currency: Currency,
): Hint | null {
  if (!newBonds) return null;
  const rate = `(${newBonds.rate}%) ${newBondsLabel(newBonds, currency)}`;
  const gap = round2(newBonds.rate - annualYield);
  if (gap > WARNING_GAP) {
    return {
      tone: 'warning',
      text: `Річна дохідність ${annualYield}% на ${gap} п.п. нижча за середню ставку купону ${rate}: нова ОВДП може дати більше.`,
    };
  }
  return {
    tone: 'success',
    text:
      gap < 0
        ? `Річна дохідність ${annualYield}% вища за середню ставку купону ${rate}.`
        : `Річна дохідність ${annualYield}% близька до середньої ставки купону ${rate}.`,
  };
}
