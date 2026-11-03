import type { AppTheme } from './palette';

const CURRENCY_COLORS: Record<string, keyof AppTheme> = {
  UAH: 'currencyUah',
  USD: 'currencyUsd',
  EUR: 'currencyEur',
};

/** The currency's own badge color, so each currency reads apart in a list at a glance. */
export function currencyColor(currency: string): keyof AppTheme {
  return CURRENCY_COLORS[currency] ?? 'accent';
}
