import { addDaysISO } from '@/utils/date';

import { nbuClient } from './client';
import { fillDailyRates } from './dailyRates';

type NbuKeyRow = {
  dt: string;
  id_api: string;
  value: number;
};

/** Days before 1 January asked for too, in case the year's first days are not published yet. */
const LOOKBACK_DAYS = 14;

/**
 * The NBU key policy rate, % a year, on every day of a year up to `throughDate`, in one request:
 * it changes a few times a year, so a year's rates come together and every date of it is read
 * from them.
 */
export async function fetchKeyRates(
  year: number,
  throughDate: string,
  signal?: AbortSignal,
): Promise<Record<string, number>> {
  const firstDate = `${year}-01-01`;
  const { data } = await nbuClient.get<NbuKeyRow[]>('/NBUStatService/v1/statdirectory/key', {
    params: {
      start: addDaysISO(firstDate, -LOOKBACK_DAYS).replaceAll('-', ''),
      end: throughDate.replaceAll('-', ''),
      id_api: 'KEY_PolicyRate',
      json: '',
    },
    signal,
  });

  const rows = data
    .filter((row) => row.id_api === 'KEY_PolicyRate')
    .map(({ dt, value }) => ({
      date: `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}`,
      rate: value,
    }));

  return fillDailyRates(
    rows,
    firstDate,
    throughDate,
    (date) => `НБУ не повернув облікову ставку на ${date}`,
  );
}
