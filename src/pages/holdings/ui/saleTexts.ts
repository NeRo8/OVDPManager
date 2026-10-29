import type { Currency } from '@/entities/portfolio';

import { formatMoney } from '@/shared/lib';

/** «Продаж без збитку» in words: from what price per bond, or any once payments returned the cost. */
export function breakEvenText(breakEvenPrice: number, currency: Currency): string {
  return breakEvenPrice === 0
    ? 'за будь-якою ціною'
    : `від ${formatMoney(breakEvenPrice, currency)}`;
}
