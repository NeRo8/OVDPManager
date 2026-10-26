import { nbuClient } from '@/shared/api';
import { addDaysISO } from '@/shared/lib';

export type ExchangeCurrency = 'USD' | 'EUR';

type NbuExchangeRow = {
  exchangedate: string;
  cc: string;
  /** Hryvnia per one unit of the foreign currency. */
  rate_per_unit: number;
};

const LOOKBACK_DAYS = 14;

/** Daily official hryvnia rates for one year, including weekends at the last effective rate. */
export async function fetchExchangeRates(
  currency: ExchangeCurrency,
  year: number,
  throughDate: string,
  signal?: AbortSignal,
): Promise<Record<string, number>> {
  const firstDate = `${year}-01-01`;
  const start = addDaysISO(firstDate, -LOOKBACK_DAYS).replaceAll('-', '');
  const end = throughDate.replaceAll('-', '');
  const { data } = await nbuClient.get<NbuExchangeRow[]>('/NBU_Exchange/exchange_site', {
    params: { start, end, valcode: currency, sort: 'exchangedate', order: 'asc', json: '' },
    signal,
  });
  if (!Array.isArray(data)) throw new Error('НБУ не повернув курси валют');

  const rows = data
    .filter(
      (row) => row.cc === currency && Number.isFinite(row.rate_per_unit) && row.rate_per_unit > 0,
    )
    .map((row) => {
      const [day, month, rowYear] = row.exchangedate.split('.');
      return { date: `${rowYear}-${month}-${day}`, rate: row.rate_per_unit };
    })
    .sort((first, second) => first.date.localeCompare(second.date));

  const rates: Record<string, number> = {};
  let latest: number | undefined;
  let rowIndex = 0;
  for (let date = firstDate; date <= throughDate; date = addDaysISO(date, 1)) {
    while (rowIndex < rows.length && rows[rowIndex].date <= date) {
      latest = rows[rowIndex].rate;
      rowIndex += 1;
    }
    if (latest === undefined) throw new Error(`НБУ не повернув курс ${currency} на ${date}`);
    rates[date] = latest;
  }
  return rates;
}
