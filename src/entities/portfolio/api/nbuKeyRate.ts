import { nbuClient } from '@/shared/api';
import { addDaysISO } from '@/shared/lib';

import { fillDailyRates } from './dailyRates';

/** A row of `/NBUStatService/v1/statdirectory/key?start=YYYYMMDD&end=YYYYMMDD&id_api=…&json`. */
type NbuKeyRow = {
  /** `YYYYMMDD` */
  dt: string;
  /** `KEY_PolicyRate` for the key policy rate; overnight rates share the endpoint */
  id_api: string;
  /** % a year */
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
    .map((row) => ({
      date: `${row.dt.slice(0, 4)}-${row.dt.slice(4, 6)}-${row.dt.slice(6, 8)}`,
      rate: row.value,
    }));

  return fillDailyRates(
    rows,
    firstDate,
    throughDate,
    (date) => `НБУ не повернув облікову ставку на ${date}`,
  );
}
