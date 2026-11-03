import { formatPercent } from '@/utils/format';

type Props = {
  /** Percent; null when there is none to show, which reads «—» */
  value: number | null;
};

/**
 * A percentage as text, with the decimal comma: «16,5%». It takes the style of the text around it,
 * so it goes inside a `Typography` or as an `InfoRow` value. Inside a string (a subtitle, an
 * accessibility label, a hint) use `formatPercent` instead.
 */
export function Percent({ value }: Props) {
  return value === null ? '—' : formatPercent(value);
}
