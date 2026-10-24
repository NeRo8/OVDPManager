import { type Bond, bondChoices, canBuyOn, isRedeemed, maturesWithin } from '../portfolio';

function bondOf(isin: string, maturityDate: string): Bond {
  return {
    isin,
    nominal: 1000,
    rate: 10,
    currency: 'UAH',
    issueDate: '2024-01-01',
    maturityDate,
    description: '',
    payments: [],
  };
}

const maturingToday = bondOf('UA4000000001', '2026-03-15');
const today = '2026-03-15';

describe('the maturity date', () => {
  it('keeps the bond in circulation on the day itself, redeemed the day after', () => {
    expect(isRedeemed(maturingToday, today)).toBe(false);
    expect(isRedeemed(maturingToday, '2026-03-16')).toBe(true);
  });

  it('is too late to buy: only the days before it are', () => {
    expect(canBuyOn(maturingToday, '2026-03-14')).toBe(true);
    expect(canBuyOn(maturingToday, today)).toBe(false);
  });
});

describe('maturesWithin', () => {
  it('counts the last day of the span in', () => {
    const inSixMonths = bondOf('UA4000000002', '2026-09-15');
    expect(maturesWithin(inSixMonths, today, 6)).toBe(true);
    expect(maturesWithin(inSixMonths, '2026-03-14', 6)).toBe(false);
  });
});

describe('bondChoices', () => {
  const later = bondOf('UA4000000003', '2027-01-01');
  const sooner = bondOf('UA4000000004', '2026-06-01');
  const redeemed = bondOf('UA4000000005', '2025-12-01');
  const bonds = [later, maturingToday, redeemed, sooner];

  it('offers only the bonds that can still be bought, the soonest maturity first', () => {
    expect(bondChoices(bonds, '', today).map(({ isin }) => isin)).toEqual([
      sooner.isin,
      later.isin,
    ]);
  });

  it('finds any bond by ISIN, those that can still be bought first', () => {
    expect(bondChoices(bonds, 'UA4000', today).map(({ isin }) => isin)).toEqual([
      sooner.isin,
      later.isin,
      redeemed.isin,
      maturingToday.isin,
    ]);
  });
});
