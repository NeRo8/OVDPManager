import type { Wallet } from '@/lib/portfolio/wallet';
import { addMonthsISO, monthRange } from '@/utils/date';

export const PERIOD_OPTIONS = [
  { value: 'month', label: 'Цей місяць' },
  { value: 'lastMonth', label: 'Минулий місяць' },
  { value: 'quarter', label: 'Цей квартал' },
  { value: 'lastQuarter', label: 'Минулий квартал' },
  { value: 'yearToDate', label: 'Від початку року' },
  { value: 'last12Months', label: 'Останні 12 місяців' },
  { value: 'plan', label: 'Увесь план' },
  { value: 'custom', label: 'Власний період' },
];

export function periodDates(
  option: string | undefined,
  wallet: Wallet,
  custom?: { from: string; to: string } | null,
) {
  const { today } = wallet;
  const quarterMonth = Math.floor((Number(today.slice(5, 7)) - 1) / 3) * 3 + 1;
  const quarterStart = `${today.slice(0, 4)}-${String(quarterMonth).padStart(2, '0')}-01`;
  const quarter = (offset: number) => {
    const from = addMonthsISO(quarterStart, offset * 3);
    return { from, to: monthRange(addMonthsISO(from, 2)).to };
  };
  switch (option) {
    case 'month':
      return monthRange(today);
    case 'lastMonth':
      return monthRange(today, -1);
    case 'quarter':
      return quarter(0);
    case 'lastQuarter':
      return quarter(-1);
    case 'yearToDate':
      return { from: `${today.slice(0, 4)}-01-01`, to: today };
    case 'plan': {
      const dates = [...wallet.operationEvents, ...wallet.payments]
        .map((event) => event.date)
        .sort();
      return { from: dates[0] ?? today, to: dates.at(-1) ?? today };
    }
    case 'custom':
      if (custom) return custom;
  }
  return { from: monthRange(today, -12).from, to: monthRange(today, -1).to };
}

/** Each partial month contributes its covered fraction; both endpoint days count. */
export function monthsInSpan(from: string, to: string): number {
  let total = 0;
  for (let month = `${from.slice(0, 7)}-01`; month <= to; month = addMonthsISO(month, 1)) {
    const end = monthRange(month).to;
    const days = Number(end.slice(8, 10));
    const first = month < from ? Number(from.slice(8, 10)) : 1;
    const last = end > to ? Number(to.slice(8, 10)) : days;
    total += (last - first + 1) / days;
  }
  return total;
}
