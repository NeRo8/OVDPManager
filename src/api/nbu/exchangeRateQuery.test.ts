import { useExchangeRateStore } from '@/stores/exchangeRate/store';

import { exchangeRateQuery } from './exchangeRateQuery';
import { fetchExchangeRates } from './nbuExchangeRates';

jest.mock('./nbuExchangeRates', () => ({ fetchExchangeRates: jest.fn() }));

const today = '2026-10-31';
const entry = (throughDate: string, rate: number) => ({
  rates: { [throughDate]: rate },
  throughDate,
  updatedAt: 1000,
});

describe('exchangeRateQuery', () => {
  beforeEach(() => {
    useExchangeRateStore.setState({ byCurrencyYear: {} });
    jest.mocked(fetchExchangeRates).mockReset();
  });

  afterEach(() => jest.restoreAllMocks());

  it('reuses complete past rates for the selected currency but not incomplete or other currency rates', () => {
    const usd = entry('2025-12-31', 42);
    useExchangeRateStore.setState({
      byCurrencyYear: { 'USD-2025': usd, 'EUR-2025': entry('2025-12-30', 48) },
    });
    const query = exchangeRateQuery('USD', 2025, today);
    expect(query.queryKey).toEqual(['nbu', 'exchange-rates', 'USD', 2025, '2025-12-31']);
    expect(query.staleTime).toBe(Infinity);
    expect((query.initialData as () => unknown)()).toEqual(usd.rates);
    expect((query.initialDataUpdatedAt as () => unknown)()).toBe(1000);
    expect((exchangeRateQuery('EUR', 2025, today).initialData as () => unknown)()).toBeUndefined();
  });

  it('refreshes incomplete current-year rates and caches successful results without changing other years', async () => {
    const previous = entry('2025-12-31', 42);
    useExchangeRateStore.setState({
      byCurrencyYear: { 'USD-2025': previous, 'USD-2026': entry('2026-10-30', 43) },
    });
    const query = exchangeRateQuery('USD', 2026, today);
    expect(query.staleTime).toBe(12 * 60 * 60 * 1000);
    expect((query.initialData as () => unknown)()).toBeUndefined();
    jest.mocked(fetchExchangeRates).mockResolvedValue({ [today]: 44 });
    jest.spyOn(Date, 'now').mockReturnValue(5000);
    const { signal } = new AbortController();
    const fetchYear = query.queryFn as (context: object) => Promise<unknown>;

    await expect(fetchYear({ signal })).resolves.toEqual({ [today]: 44 });
    expect(fetchExchangeRates).toHaveBeenCalledWith('USD', 2026, today, signal);
    expect(useExchangeRateStore.getState().byCurrencyYear).toEqual({
      'USD-2025': previous,
      'USD-2026': { rates: { [today]: 44 }, throughDate: today, updatedAt: 5000 },
    });
    expect((exchangeRateQuery('USD', 2026, today).initialData as () => unknown)()).toEqual({
      [today]: 44,
    });
  });

  it('keeps saved rates when the refresh fails', async () => {
    const cached = entry('2026-10-30', 43);
    useExchangeRateStore.setState({ byCurrencyYear: { 'USD-2026': cached } });
    jest.mocked(fetchExchangeRates).mockRejectedValue(new Error('offline'));
    const fetchYear = exchangeRateQuery('USD', 2026, today).queryFn as (
      context: object,
    ) => Promise<unknown>;

    await expect(fetchYear({ signal: new AbortController().signal })).rejects.toThrow('offline');
    expect(useExchangeRateStore.getState().byCurrencyYear['USD-2026']).toEqual(cached);
  });
});
