import { type Bond, type Purchase, groupPositions } from '../portfolio';
import { positionIncome, resultsByCurrency, walletPosition } from '../position';

/** Two years, a 10% coupon paid twice a year on a nominal of 1000, redeemed at once. */
const bond: Bond = {
  isin: 'UA4000000001',
  nominal: 1000,
  rate: 10,
  currency: 'UAH',
  issueDate: '2025-01-01',
  maturityDate: '2027-01-01',
  description: '',
  payments: [
    { date: '2025-07-01', type: 'coupon', amount: 50 },
    { date: '2026-01-01', type: 'coupon', amount: 50 },
    { date: '2026-07-01', type: 'coupon', amount: 50 },
    { date: '2027-01-01', type: 'coupon', amount: 50 },
    { date: '2027-01-01', type: 'redemption', amount: 1000 },
  ],
};

let nextId = 0;
function purchase(fields: Partial<Purchase> & Pick<Purchase, 'purchaseDate' | 'amount'>): Purchase {
  nextId += 1;
  return { id: String(nextId), isin: bond.isin, quantity: 1, currency: 'UAH', ...fields };
}

/** The Position of the purchases, as the Wallet builds it on `today`; `null` for no NBU data. */
function positionOf(purchases: Purchase[], today: string, of: Bond | null = bond) {
  return walletPosition(groupPositions(purchases)[0], of ?? undefined, today);
}

describe('walletPosition', () => {
  const bought = [purchase({ purchaseDate: '2025-01-01', amount: 1980, quantity: 2 })];

  it('sums up what the Position cost and pays, received and still ahead', () => {
    const { results } = positionOf(bought, '2026-03-15');
    expect(results).toEqual({
      invested: 1980,
      coupons: 400,
      redemption: 2000,
      received: 200,
      expected: 2200,
      totalPayments: 2400,
      complete: true,
      netIncome: 420,
      returnPercent: 21.21,
    });
  });

  it('is in circulation up to its maturity date and redeemed the day after', () => {
    expect(positionOf(bought, '2026-03-15').state).toBe('inCirculation');
    expect(positionOf(bought, '2027-01-01').state).toBe('inCirculation');
    expect(positionOf(bought, '2027-01-02').state).toBe('redeemed');
  });

  it('is planned while every purchase is still ahead', () => {
    const planned = [purchase({ purchaseDate: '2026-05-01', amount: 990 })];
    expect(positionOf(planned, '2026-03-15').state).toBe('planned');
    expect(positionOf(planned, '2026-05-01').state).toBe('inCirculation');
  });

  it('knows nothing but its cost without the NBU data', () => {
    const position = positionOf(bought, '2026-03-15', null);
    expect(position.state).toBe('unknown');
    expect(position.results).toBeUndefined();
    expect(position.annualYield).toBeNull();
    expect(position.payments).toEqual([]);
  });

  it('leaves the net income and the yield out until the redemption is published', () => {
    const unpublished = { ...bond, payments: bond.payments.filter((p) => p.type === 'coupon') };
    const { results, annualYield } = positionOf(bought, '2026-03-15', unpublished);
    expect(results?.complete).toBe(false);
    expect(results?.netIncome).toBeNull();
    expect(results?.returnPercent).toBeNull();
    expect(annualYield).toBeNull();
  });

  it('yields about the coupon rate when bought at the nominal', () => {
    const atNominal = [purchase({ purchaseDate: '2025-01-01', amount: 1000 })];
    expect(positionOf(atNominal, '2026-03-15').annualYield).toBeCloseTo(10, 0);
  });

  it('weights the yields of its purchases by what each cost', () => {
    const cheap = purchase({ purchaseDate: '2025-01-01', amount: 900 });
    const dear = purchase({ purchaseDate: '2025-01-01', amount: 1100 });
    const both = positionOf([cheap, dear], '2026-03-15').annualYield ?? 0;
    const alone = (one: Purchase) => positionOf([one], '2026-03-15').annualYield ?? 0;
    expect(both).toBeCloseTo((alone(cheap) * 900 + alone(dear) * 1100) / 2000, 1);
  });

  it('gives a payment on the purchase day to the previous owner', () => {
    const onCouponDay = [purchase({ purchaseDate: '2026-01-01', amount: 1000 })];
    const { payments } = positionOf(onCouponDay, '2026-03-15');
    expect(payments.map((payment) => payment.date)).toEqual([
      '2026-07-01',
      '2027-01-01',
      '2027-01-01',
    ]);
  });
});

describe('positionIncome', () => {
  const bought = [purchase({ purchaseDate: '2025-01-01', amount: 1980, quantity: 2 })];

  it('counts the coupons of the span', () => {
    expect(positionIncome(positionOf(bought, '2026-03-15'), '2026-01-01', '2026-12-31')).toBe(200);
  });

  it('adds what a redemption brought over the cost of the bonds it repays', () => {
    expect(positionIncome(positionOf(bought, '2026-03-15'), '2027-01-01', '2027-12-31')).toBe(120);
  });

  it('costs a top-up between partial redemptions against the nominal left', () => {
    const amortizing: Bond = {
      ...bond,
      payments: [
        { date: '2026-01-01', type: 'redemption', amount: 500 },
        { date: '2027-01-01', type: 'redemption', amount: 500 },
      ],
    };
    const first = purchase({ purchaseDate: '2025-01-01', amount: 990 });
    const topUp = purchase({ purchaseDate: '2026-06-01', amount: 495 });
    const item = positionOf([first, topUp], '2026-03-15', amortizing);
    // 500 − 990 × ½ for the first part, then 1000 − (990 × ½ + 495 × 1) for the rest.
    expect(positionIncome(item, '2025-01-01', '2027-12-31')).toBe(15);
  });

  it('is nothing without the NBU data', () => {
    expect(positionIncome(positionOf(bought, '2026-03-15', null), '2025-01-01', '2027-12-31')).toBe(
      0,
    );
  });
});

describe('resultsByCurrency', () => {
  const dollarBond: Bond = { ...bond, isin: 'UA4000000002', currency: 'USD' };
  const uah = positionOf([purchase({ purchaseDate: '2025-01-01', amount: 1000 })], '2026-03-15');
  const usd = walletPosition(
    groupPositions([
      purchase({ isin: dollarBond.isin, currency: 'USD', purchaseDate: '2025-01-01', amount: 950 }),
    ])[0],
    dollarBond,
    '2026-03-15',
  );
  const unknown = positionOf(
    [purchase({ purchaseDate: '2025-01-01', amount: 500 })],
    '2026-03-15',
    null,
  );

  it('sums the Positions of each currency and leaves out those without the NBU data', () => {
    const totals = resultsByCurrency([uah, unknown, usd, uah]);
    expect(totals.map(({ currency }) => currency)).toEqual(['UAH', 'USD']);
    expect(totals[0]).toMatchObject({
      invested: 2000,
      totalPayments: 2400,
      netIncome: 400,
      returnPercent: 20,
    });
    expect(totals[1]).toMatchObject({ invested: 950, netIncome: 250 });
  });

  it('counts the net income of the Positions whose redemption is published, and how many are not', () => {
    const unpublished = { ...bond, payments: bond.payments.filter((p) => p.type === 'coupon') };
    const incomplete = positionOf(
      [purchase({ purchaseDate: '2025-01-01', amount: 1000 })],
      '2026-03-15',
      unpublished,
    );
    const [total] = resultsByCurrency([uah, incomplete]);
    expect(total).toMatchObject({
      complete: false,
      incompleteCount: 1,
      invested: 2000,
      netIncome: 200,
      returnPercent: 20,
    });
    expect(resultsByCurrency([incomplete])[0].netIncome).toBeNull();
  });
});
