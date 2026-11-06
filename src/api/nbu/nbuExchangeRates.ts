import { addDaysISO } from '@/utils/date';

import { nbuClient } from './client';
import { fillDailyRates } from './dailyRates';

export type ExchangeCurrency = 'USD' | 'EUR';
type ExchangeRow = { exchangedate: string; cc: string; rate_per_unit: number };

/** Daily NBU rates in hryvnias per unit, carrying the last rate over non-working days. */
export async function fetchExchangeRates(
  currency: ExchangeCurrency,
  year: number,
  through: string,
  signal?: AbortSignal,
): Promise<Record<string, number>> {
  const firstDate = `${year}-01-01`;
  const { data } = await nbuClient.get<ExchangeRow[]>('/NBU_Exchange/exchange_site', {
    params: {
      start: addDaysISO(firstDate, -14).replaceAll('-', ''),
      end: through.replaceAll('-', ''),
      valcode: currency,
      sort: 'exchangedate',
      order: 'asc',
      json: '',
    },
    signal,
  });
  const rows = data
    .filter((row) => row.cc === currency)
    .map((row) => {
      const [day, month, rowYear] = row.exchangedate.split('.');
      return { date: `${rowYear}-${month}-${day}`, rate: row.rate_per_unit };
    });
  return fillDailyRates(
    rows,
    firstDate,
    through,
    (date) => `НБУ не повернув курс ${currency} на ${date}`,
  );
}
