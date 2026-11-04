import { nbuClient } from './client';
import { fetchBonds } from './nbuBonds';

const security = (fields: Record<string, unknown>) => ({
  cptype: 'DCP',
  cpcode: 'UA4000000001',
  nominal: 1000,
  auk_proc: 16.5,
  pgs_date: '2027-06-01',
  razm_date: '2025-06-01',
  cpdescr: 'Середньострокові',
  val_code: 'UAH',
  payments: [],
  ...fields,
});

/** NBU answers with `securities`, as `/depo_securities?json` does. */
function answer(securities: object[]) {
  jest.spyOn(nbuClient, 'get').mockResolvedValue({ data: securities });
}

afterEach(() => jest.restoreAllMocks());

describe('fetchBonds', () => {
  it('turns an NBU security into a Bond', async () => {
    answer([
      security({
        cpcode: ' ua4000000001 ',
        payments: [
          { pay_date: '2027-06-01', pay_type: '2', pay_val: 1000, array: 'true' },
          { pay_date: '2026-12-01', pay_type: '1', pay_val: 82.5, array: 'true' },
          { pay_date: '2027-06-01', pay_type: '1', pay_val: 82.5, array: 'true' },
        ],
      }),
    ]);
    await expect(fetchBonds()).resolves.toEqual([
      {
        isin: 'UA4000000001',
        kind: 'ovdp',
        nominal: 1000,
        rate: 16.5,
        currency: 'UAH',
        issueDate: '2025-06-01',
        maturityDate: '2027-06-01',
        description: 'Середньострокові',
        // By date; on the maturity day the last coupon comes before the redemption.
        payments: [
          { date: '2026-12-01', type: 'coupon', amount: 82.5 },
          { date: '2027-06-01', type: 'coupon', amount: 82.5 },
          { date: '2027-06-01', type: 'redemption', amount: 1000 },
        ],
      },
    ]);
  });

  it('distinguishes domestic and external government bonds and excludes other securities', async () => {
    answer([
      security({ cpcode: 'UA1', cptype: 'DCP' }),
      security({ cpcode: 'XS1', cptype: 'OZDP' }),
      security({ cpcode: 'UA2', cptype: 'OMP' }),
    ]);
    expect((await fetchBonds()).map(({ isin, kind }) => [isin, kind])).toEqual([
      ['UA1', 'ovdp'],
      ['XS1', 'ozdp'],
    ]);
  });

  it('keeps the bonds in hryvnia, dollars and euros and skips any other currency', async () => {
    answer([
      security({ cpcode: 'UA1', val_code: 'UAH' }),
      security({ cpcode: 'UA2', val_code: 'USD' }),
      security({ cpcode: 'UA3', val_code: 'EUR' }),
      security({ cpcode: 'UA4', val_code: 'GBP' }),
    ]);
    const bonds = await fetchBonds();
    expect(bonds.map(({ isin, currency }) => `${isin} ${currency}`)).toEqual([
      'UA1 UAH',
      'UA2 USD',
      'UA3 EUR',
    ]);
  });

  it('asks NBU for the depository list, cancellable', async () => {
    answer([]);
    const { signal } = new AbortController();
    await fetchBonds(signal);
    expect(nbuClient.get).toHaveBeenCalledWith('/depo_securities?json', { signal });
  });
});
