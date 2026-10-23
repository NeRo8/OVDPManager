import { nbuClient } from '@/shared/api';
import { addDaysISO } from '@/shared/lib';

/** A row of `/NBUStatService/v1/statdirectory/key?date=YYYYMMDD&json`. */
type NbuKeyRow = {
  /** `KEY_PolicyRate` for the key policy rate; overnight rates come in the same answer */
  id_api: string;
  /** % a year */
  value: number;
};

/** NBU publishes the rates on working days; a weekend or holiday date answers with nothing. */
const DAYS_TO_LOOK_BACK = 7;

/** The NBU key policy rate, % a year, as of the latest working day up to `date`. */
export async function fetchKeyRate(date: string, signal?: AbortSignal): Promise<number> {
  for (let back = 0; back < DAYS_TO_LOOK_BACK; back += 1) {
    const day = addDaysISO(date, -back).replaceAll('-', '');
    const { data: rows } = await nbuClient.get<NbuKeyRow[]>(
      `/NBUStatService/v1/statdirectory/key?date=${day}&json`,
      { signal },
    );
    const policyRate = rows.find((row) => row.id_api === 'KEY_PolicyRate');
    if (policyRate) return policyRate.value;
  }
  throw new Error('НБУ не повернув облікову ставку');
}
