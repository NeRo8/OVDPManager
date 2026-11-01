import { formatMoney } from '@/shared/lib';

type Props = {
  /** The amount; null when there is none to show, which reads «—» */
  value: number | null;
  /** Its currency's code, shown as its sign: UAH → ₴ */
  currency: string;
};

/**
 * An amount of money as text, with Ukrainian grouping and its currency's sign: «10 200,50 ₴». It
 * takes the style of the text around it, so it goes inside a `Typography` or as the value of an
 * `InfoRow`, `LegendRow` or `TotalRow`. Inside a string (a hint, an accessibility label) use
 * `formatMoney` instead.
 */
export function Money({ value, currency }: Props) {
  return value === null ? '—' : formatMoney(value, currency);
}
