import { z } from 'zod';

import { nbuClient } from '@/shared/api';
import { addDaysISO } from '@/shared/lib';

/** A row of `/NBUStatService/v1/statdirectory/key?date=YYYYMMDD&json`. */
const NbuKeyRowSchema = z.object({
  /** `KEY_PolicyRate` for the key policy rate; overnight rates come in the same answer */
  id_api: z.string(),
  /** % a year */
  value: z.number(),
});

/** NBU publishes the rates on working days; a weekend or holiday date answers with nothing. */
const DAYS_TO_LOOK_BACK = 7;

/** The NBU key policy rate, % a year, as of the latest working day up to `today`. */
export async function fetchKeyRate(today: string, signal?: AbortSignal): Promise<number> {
  for (let back = 0; back < DAYS_TO_LOOK_BACK; back += 1) {
    const date = addDaysISO(today, -back).replaceAll('-', '');
    const { data } = await nbuClient.get<unknown>(
      `/NBUStatService/v1/statdirectory/key?date=${date}&json`,
      { signal },
    );
    const rows = z.array(NbuKeyRowSchema).safeParse(data);
    if (!rows.success) throw new Error('Неочікуваний формат відповіді НБУ');
    const policyRate = rows.data.find((row) => row.id_api === 'KEY_PolicyRate');
    if (policyRate) return policyRate.value;
  }
  throw new Error('НБУ не повернув облікову ставку');
}
