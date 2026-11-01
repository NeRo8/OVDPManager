import { useKeyRateStore } from '../keyRate/store';
import { keyRateDate, keyRateQuery, keyRateYear } from '../keyRateQuery';
import { fetchKeyRates } from '../nbuKeyRate';

jest.mock('../nbuKeyRate', () => ({ fetchKeyRates: jest.fn() }));

const today = '2026-10-31';
const HOUR = 60 * 60 * 1000;

/** A year's rates saved through `throughDate`, as the query leaves them in the store. */
function saved(year: number, throughDate: string) {
  const entry = { rates: { [throughDate]: 15 }, throughDate, updatedAt: 1000 };
  useKeyRateStore.setState({ byYear: { [year]: entry } });
  return entry;
}

beforeEach(() => {
  useKeyRateStore.setState({ byYear: {} });
  jest.mocked(fetchKeyRates).mockReset();
});

describe('keyRateDate and keyRateYear', () => {
  it('read a date ahead as today, the best guess there is', () => {
    expect(keyRateDate('2026-03-01', today)).toBe('2026-03-01');
    expect(keyRateDate(today, today)).toBe(today);
    expect(keyRateDate('2027-02-01', today)).toBe(today);
    expect(keyRateYear('2027-02-01', today)).toBe(2026);
    expect(keyRateYear('2024-12-31', today)).toBe(2024);
  });
});

describe('keyRateQuery', () => {
  it('never refetches a past year, and starts from its saved rates once they are whole', () => {
    const entry = saved(2025, '2025-12-31');
    const query = keyRateQuery(2025, today);
    expect(query.queryKey).toEqual(['nbu', 'key-rate', 2025]);
    expect(query.staleTime).toBe(Infinity);
    expect((query.initialData as () => unknown)()).toEqual(entry.rates);
    expect((query.initialDataUpdatedAt as () => unknown)()).toBe(1000);
  });

  it('asks for a past year again when its saved rates stop short of 31 December', () => {
    saved(2025, '2025-11-30');
    expect((keyRateQuery(2025, today).initialData as () => unknown)()).toBeUndefined();
  });

  it('keeps the current year for half a day, and asks again once a new day has begun', () => {
    saved(2026, '2026-10-30');
    const query = keyRateQuery(2026, today);
    expect(query.staleTime).toBe(12 * HOUR);
    expect((query.initialData as () => unknown)()).toBeUndefined();

    const entry = saved(2026, today);
    expect((keyRateQuery(2026, today).initialData as () => unknown)()).toEqual(entry.rates);
  });

  it('fetches the year through the date its rates are needed for and saves them', async () => {
    jest.mocked(fetchKeyRates).mockResolvedValue({ '2025-12-31': 15.5 });
    jest.spyOn(Date, 'now').mockReturnValue(5000);
    const { signal } = new AbortController();
    const fetchYear = keyRateQuery(2025, today).queryFn as (context: object) => Promise<unknown>;

    await expect(fetchYear({ signal })).resolves.toEqual({ '2025-12-31': 15.5 });
    expect(fetchKeyRates).toHaveBeenCalledWith(2025, '2025-12-31', signal);
    expect(useKeyRateStore.getState().byYear[2025]).toEqual({
      rates: { '2025-12-31': 15.5 },
      throughDate: '2025-12-31',
      updatedAt: 5000,
    });
    jest.restoreAllMocks();
  });
});
