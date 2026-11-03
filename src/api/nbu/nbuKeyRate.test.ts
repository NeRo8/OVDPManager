import { nbuClient } from './client';
import { fetchKeyRates } from './nbuKeyRate';

const row = (dt: string, value: number, id_api = 'KEY_PolicyRate') => ({ dt, id_api, value });

function answer(rows: object[]) {
  jest.spyOn(nbuClient, 'get').mockResolvedValue({ data: rows });
}

afterEach(() => jest.restoreAllMocks());

describe('fetchKeyRates', () => {
  it('asks for the year up to the date, from two weeks before 1 January', async () => {
    answer([row('20251231', 15.5)]);
    await fetchKeyRates(2026, '2026-01-03');
    expect(nbuClient.get).toHaveBeenCalledWith('/NBUStatService/v1/statdirectory/key', {
      params: { start: '20251218', end: '20260103', id_api: 'KEY_PolicyRate', json: '' },
      signal: undefined,
    });
  });

  it('gives every day its rate, the days NBU skips the one in effect on them', async () => {
    answer([row('20251231', 15.5), row('20260102', 15), row('20260102', 99, 'KEY_Other')]);
    await expect(fetchKeyRates(2026, '2026-01-04')).resolves.toEqual({
      // 1 January takes the rate NBU set the day before.
      '2026-01-01': 15.5,
      '2026-01-02': 15,
      '2026-01-03': 15,
      '2026-01-04': 15,
    });
  });

  it('fails when NBU has no rate for the first day of the year', async () => {
    answer([row('20260105', 15)]);
    await expect(fetchKeyRates(2026, '2026-01-05')).rejects.toThrow(
      'НБУ не повернув облікову ставку на 2026-01-01',
    );
  });
});
