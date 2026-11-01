import {
  type Bond,
  bondChoices,
  canBuyOn,
  isRedeemed,
  maturesWithin,
  positionPayments,
  pricePerBond,
  purchaseEvents,
} from '../portfolio';

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

it('does not divide by a zero quantity when displaying a price', () => {
  expect(pricePerBond(1000, 0)).toBeNull();
  expect(pricePerBond(1000, 2)).toBe(500);
});

it('identifies same-day top-ups consistently regardless of storage order', () => {
  const purchase = {
    isin: maturingToday.isin,
    purchaseDate: '2025-01-01',
    quantity: 1,
    amount: 1000,
    currency: 'UAH' as const,
  };
  const first = { ...purchase, id: 'a' };
  const second = { ...purchase, id: 'b' };
  const events = (items: (typeof first)[]) =>
    purchaseEvents(items, new Map()).map(({ id, isTopUp }) => [id, isTopUp]);
  expect(events([first, second])).toEqual([
    ['a', false],
    ['b', true],
  ]);
  expect(events([second, first])).toEqual(events([first, second]));
});

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

  it('finds bonds by maturity date and by a coupon rate with a percent sign', () => {
    expect(bondChoices(bonds, '01.06.2026', today).map(({ isin }) => isin)).toEqual([sooner.isin]);
    expect(
      bondChoices([{ ...sooner, rate: 16.5 }, later], '16,5%', today).map(({ isin }) => isin),
    ).toEqual([sooner.isin]);
  });
});

describe('positionPayments', () => {
  const bond: Bond = {
    ...bondOf('UA4000000009', '2027-03-01'),
    payments: [
      { date: '2025-09-01', type: 'coupon', amount: 50 },
      { date: '2026-09-01', type: 'coupon', amount: 50 },
      { date: '2027-03-01', type: 'redemption', amount: 1000 },
    ],
  };
  const purchase = (id: string, purchaseDate: string, quantity: number) => ({
    id,
    isin: bond.isin,
    purchaseDate,
    amount: quantity * 1000,
    quantity,
    currency: 'UAH' as const,
  });

  it('counts of each payment the bonds of purchases still planned', () => {
    // Two bonds bought, three more planned for June.
    const payments = positionPayments(
      [purchase('made', '2025-01-10', 2), purchase('planned', '2026-06-01', 3)],
      bond,
      '2026-03-01',
    );
    expect(
      payments.map(({ date, quantity, plannedQuantity }) => [date, quantity, plannedQuantity]),
    ).toEqual([
      ['2025-09-01', 2, 0],
      ['2026-09-01', 5, 3],
      ['2027-03-01', 5, 3],
    ]);
  });
});
