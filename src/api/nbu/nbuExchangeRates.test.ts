import { nbuClient } from './client';
import { fetchExchangeRates } from './nbuExchangeRates';

const row = (exchangedate: string, rate_per_unit: number, cc = 'USD') => ({
  exchangedate,
  rate_per_unit,
  cc,
});

describe('fetchExchangeRates', () => {
  afterEach(() => jest.restoreAllMocks());

  it('requests the selected currency across the year boundary and carries rates over skipped days', async () => {
    jest.spyOn(nbuClient, 'get').mockResolvedValue({
      data: [row('31.12.2025', 42), row('02.01.2026', 43), row('02.01.2026', 50, 'EUR')],
    });
    const { signal } = new AbortController();

    await expect(fetchExchangeRates('USD', 2026, '2026-01-04', signal)).resolves.toEqual({
      '2026-01-01': 42,
      '2026-01-02': 43,
      '2026-01-03': 43,
      '2026-01-04': 43,
    });
    expect(nbuClient.get).toHaveBeenCalledWith('/NBU_Exchange/exchange_site', {
      params: {
        start: '20251218',
        end: '20260104',
        valcode: 'USD',
        sort: 'exchangedate',
        order: 'asc',
        json: '',
      },
      signal,
    });
  });

  it('reports a missing initial rate rather than guessing', async () => {
    jest.spyOn(nbuClient, 'get').mockResolvedValue({ data: [row('02.01.2026', 43, 'EUR')] });
    await expect(fetchExchangeRates('EUR', 2026, '2026-01-02')).rejects.toThrow(
      'НБУ не повернув курс EUR на 2026-01-01',
    );
  });
});
