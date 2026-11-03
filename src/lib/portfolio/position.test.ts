import { formatMoney } from '@/utils/format';

import { type Bond, type Operation, groupPositions } from './portfolio';
import { netIncomeBasis, resultsByCurrency, walletPosition } from './position';

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
function purchase(fields: Partial<Operation> & Pick<Operation, 'date' | 'amount'>): Operation {
  nextId += 1;
  return {
    type: 'purchase',
    ovdp: null,
    id: String(nextId),
    isin: bond.isin,
    quantity: 1,
    currency: 'UAH',
    ...fields,
  };
}

/** The Position of the operations, as the Wallet builds it on `today`; `null` for no NBU data. */
function positionOf(operations: Operation[], today: string, of: Bond | null = bond) {
  return walletPosition(groupPositions(operations)[0], of ?? undefined, today);
}

describe('walletPosition', () => {
  const bought = [purchase({ date: '2025-01-01', amount: 1980, quantity: 2 })];

  it('sums up what the Position cost and pays, received and still ahead', () => {
    const { results } = positionOf(bought, '2026-03-15');
    expect(results).toEqual({
      invested: 1980,
      coupons: 400,
      redemption: 2000,
      saleProceeds: 0,
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

  it('tells what of the Position is still only planned', () => {
    const mixed = [...bought, purchase({ date: '2026-05-01', amount: 990, quantity: 1 })];
    expect(positionOf(mixed, '2026-03-15').planned).toEqual({ quantity: 1, amount: 990 });
    expect(positionOf(mixed, '2026-05-01').planned).toEqual({ quantity: 0, amount: 0 });
  });

  it('is planned while every purchase is still ahead', () => {
    const planned = [purchase({ date: '2026-05-01', amount: 990 })];
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
    const atNominal = [purchase({ date: '2025-01-01', amount: 1000 })];
    expect(positionOf(atNominal, '2026-03-15').annualYield).toBeCloseTo(10, 0);
  });

  it('weights the yields of its operations by what each cost', () => {
    const cheap = purchase({ date: '2025-01-01', amount: 900 });
    const dear = purchase({ date: '2025-01-01', amount: 1100 });
    const both = positionOf([cheap, dear], '2026-03-15').annualYield ?? 0;
    const alone = (one: Operation) => positionOf([one], '2026-03-15').annualYield ?? 0;
    expect(both).toBeCloseTo((alone(cheap) * 900 + alone(dear) * 1100) / 2000, 1);
  });

  it('leaves a purchase with no yield out of the yield and counts it, the others still yielding', () => {
    const atNominal = purchase({ date: '2025-01-01', amount: 1000 });
    // 1 ₴ for a bond that pays 1 200 ₴: no yield up to 1000 % fits, most likely a typo.
    const typo = purchase({ date: '2025-01-01', amount: 1 });
    const position = positionOf([atNominal, typo], '2026-03-15');
    expect(position.annualYield).toBe(positionOf([atNominal], '2026-03-15').annualYield);
    expect(position.annualYieldBasis).toBe(1000);
    expect(position.purchasesWithoutYield).toBe(1);
    expect(positionOf([typo], '2026-03-15')).toMatchObject({
      annualYield: null,
      annualYieldBasis: 0,
      purchasesWithoutYield: 1,
    });
  });

  it('gives a payment on the purchase day to the previous owner', () => {
    const onCouponDay = [purchase({ date: '2026-01-01', amount: 1000 })];
    const { payments } = positionOf(onCouponDay, '2026-03-15');
    expect(payments.map((payment) => payment.date)).toEqual([
      '2026-07-01',
      '2027-01-01',
      '2027-01-01',
    ]);
  });
});

describe('resultsByCurrency', () => {
  const dollarBond: Bond = { ...bond, isin: 'UA4000000002', currency: 'USD' };
  const uah = positionOf([purchase({ date: '2025-01-01', amount: 1000 })], '2026-03-15');
  const usd = walletPosition(
    groupPositions([
      purchase({ isin: dollarBond.isin, currency: 'USD', date: '2025-01-01', amount: 950 }),
    ])[0],
    dollarBond,
    '2026-03-15',
  );
  const unknown = positionOf([purchase({ date: '2025-01-01', amount: 500 })], '2026-03-15', null);

  it('sums the Positions of each currency, counting the cost of those without the NBU data', () => {
    const totals = resultsByCurrency([uah, unknown, usd, uah]);
    expect(totals.map(({ currency }) => currency)).toEqual(['UAH', 'USD']);
    expect(totals[0]).toMatchObject({
      // 1 000 + 1 000 + 500 of the bond missing from the NBU data, whose payments are not known.
      invested: 2500,
      totalPayments: 2400,
      netIncome: 400,
      returnPercent: 20,
      complete: false,
      withoutDataCount: 1,
    });
    expect(totals[1]).toMatchObject({ invested: 950, netIncome: 250, withoutDataCount: 0 });
  });

  it('keeps a currency whose every Position is missing from the NBU data', () => {
    expect(resultsByCurrency([unknown])).toEqual([
      expect.objectContaining({
        currency: 'UAH',
        invested: 500,
        totalPayments: 0,
        netIncome: null,
        complete: false,
        withoutDataCount: 1,
      }),
    ]);
  });

  it('counts the net income of the Positions whose redemption is published, and how many are not', () => {
    const unpublished = { ...bond, payments: bond.payments.filter((p) => p.type === 'coupon') };
    const incomplete = positionOf(
      [purchase({ date: '2025-01-01', amount: 1000 })],
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
      // The net income adds up from these, not from `invested` and `totalPayments`.
      published: { invested: 1000, totalPayments: 1200 },
    });
    expect(netIncomeBasis(total)).toBe(
      `Виплати ${formatMoney(1200, 'UAH')} мінус вкладено ${formatMoney(1000, 'UAH')}, лише ОВДП з опублікованим погашенням`,
    );
    expect(netIncomeBasis(resultsByCurrency([uah])[0])).toBeUndefined();
    expect(resultsByCurrency([incomplete])[0].netIncome).toBeNull();
  });

  it('averages the annual yield by what each Position cost', () => {
    const cheap = positionOf([purchase({ date: '2025-01-01', amount: 900 })], '2026-03-15');
    const dear = positionOf([purchase({ date: '2025-01-01', amount: 1100 })], '2026-03-15');
    const [total] = resultsByCurrency([cheap, dear]);
    expect(total.annualYield).toBeCloseTo(
      ((cheap.annualYield ?? 0) * 900 + (dear.annualYield ?? 0) * 1100) / 2000,
      1,
    );
  });
});
