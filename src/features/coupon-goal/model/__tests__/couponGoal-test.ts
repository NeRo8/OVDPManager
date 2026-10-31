import { type Bond, type Purchase, buildWallet } from '@/entities/portfolio';

import { goalProgress, goalPurchaseSpan, goalYears, planCouponGoal } from '../couponGoal';

/** A bond paying its coupon twice a year, counted back from maturity, then its nominal. */
function bondOf(
  isin: string,
  issueDate: string,
  maturityDate: string,
  rate: number,
  currency: Bond['currency'] = 'UAH',
): Bond {
  const coupon = (1000 * rate) / 200;
  const dates: string[] = [];
  for (let back = 0; ; back += 6) {
    const date = new Date(`${maturityDate}T00:00:00`);
    date.setMonth(date.getMonth() - back);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (iso <= issueDate) break;
    dates.unshift(iso);
  }
  return {
    isin,
    nominal: 1000,
    rate,
    currency,
    issueDate,
    maturityDate,
    description: '',
    payments: [
      ...dates.map((date) => ({ date, type: 'coupon' as const, amount: coupon })),
      { date: maturityDate, type: 'redemption' as const, amount: 1000 },
    ],
  };
}

// Pays in January and July.
const janJul = bondOf('UA4000000001', '2026-01-20', '2029-07-25', 16);
// Pays in April and October.
const aprOct = bondOf('UA4000000002', '2026-03-03', '2029-04-25', 16);
// Placed long ago: banks no longer sell it, however well it pays.
const old = bondOf('UA4000000003', '2017-01-01', '2030-03-06', 20);
// Matures within the goal's year.
const soon = bondOf('UA4000000004', '2026-05-01', '2028-09-01', 16);
// Another currency.
const dollar = bondOf('UA4000000005', '2026-02-01', '2029-06-13', 4, 'USD');
// Held: repaid in March of the purchase year.
const held = bondOf('UA4000000006', '2025-12-01', '2027-03-24', 15.68);

const bonds = [janJul, aprOct, old, soon, dollar, held];
const byIsin = new Map(bonds.map((bond) => [bond.isin, bond]));
const today = '2026-10-31';

const purchases: Purchase[] = [
  {
    id: '1',
    isin: held.isin,
    purchaseDate: '2026-03-20',
    amount: 21750,
    quantity: 21,
    currency: 'UAH',
  },
  {
    id: '2',
    isin: janJul.isin,
    purchaseDate: '2026-02-01',
    amount: 10100,
    quantity: 10,
    currency: 'UAH',
  },
];
const wallet = buildWallet(purchases, byIsin, today);

describe('goal years and the purchases’ span', () => {
  it('offers the five years after this one, bought in the year before each', () => {
    expect(goalYears(today)).toEqual([2027, 2028, 2029, 2030, 2031]);
    expect(goalPurchaseSpan(2028, today)).toEqual({ from: '2027-01-01', to: '2027-12-31' });
  });

  it('buys from tomorrow when the purchase year is this one', () => {
    expect(goalPurchaseSpan(2027, today)).toEqual({ from: '2026-11-01', to: '2026-12-31' });
  });

  it('leaves out next year once nothing is left of this one to buy in', () => {
    expect(goalYears('2026-12-31')[0]).toBe(2028);
  });
});

describe('planCouponGoal', () => {
  const plan = planCouponGoal(wallet, bonds, { currency: 'UAH', year: 2028, monthly: 2000 }, 16);

  it('takes the plan’s coupons and closes each month’s shortfall', () => {
    expect(plan.months[0]).toEqual({ plan: 800, added: 1200 });
    expect(plan.months[3]).toEqual({ plan: 0, added: 2000 });
    expect(plan.months[6]).toEqual({ plan: 800, added: 1200 });
    expect(plan.months[9]).toEqual({ plan: 0, added: 2000 });
  });

  it('buys only bonds for sale, held through the year, in the currency', () => {
    expect(plan.bonds.map(({ bond, quantity }) => [bond.isin, quantity])).toEqual([
      [aprOct.isin, 25],
      [janJul.isin, 15],
    ]);
  });

  it('names the months no such bond pays in', () => {
    expect(plan.shortMonths).toEqual([1, 2, 4, 5, 7, 8, 10, 11]);
  });

  it('dates every purchase in the year before, buying all the bonds chosen', () => {
    expect(plan.purchases.every((p) => p.purchaseDate >= '2027-01-01')).toBe(true);
    expect(plan.purchases.every((p) => p.purchaseDate <= '2027-12-31')).toBe(true);
    for (const { bond, quantity, amount } of plan.bonds) {
      const own = plan.purchases.filter((purchase) => purchase.isin === bond.isin);
      expect(own.reduce((sum, purchase) => sum + purchase.quantity, 0)).toBe(quantity);
      expect(own.reduce((sum, purchase) => sum + purchase.amount, 0)).toBeCloseTo(amount, 2);
    }
  });

  it('pays with the plan’s coupons and redemptions first, then equal monthly top-ups', () => {
    // The held bond's last coupon and its redemption, and the January and July coupons.
    expect(plan.planMoney).toBe(1646.4 + 21000 + 800 + 800);
    expect(plan.topUpMonths).toBe(12);
    expect(plan.monthlyTopUp).toBeGreaterThan(0);
    expect(plan.leftover).toBeGreaterThanOrEqual(0);
    expect(plan.cost).toBeCloseTo(plan.planMoney + plan.monthlyTopUp * 12 - plan.leftover, 2);
  });

  it('needs no money of one’s own when the plan’s money covers the purchases', () => {
    const small = planCouponGoal(wallet, bonds, { currency: 'UAH', year: 2028, monthly: 500 }, 16);
    expect(small.monthlyTopUp).toBe(0);
    // The January coupon buys no whole bond; the March redemption buys them all.
    expect(
      small.purchases.map(({ isin, purchaseDate, quantity }) => [isin, purchaseDate, quantity]),
    ).toEqual([[aprOct.isin, '2027-03-24', 7]]);
  });

  it('buys nothing in a currency with no bonds for the goal', () => {
    const euro = planCouponGoal(wallet, bonds, { currency: 'EUR', year: 2028, monthly: 100 }, 16);
    expect(euro.purchases).toEqual([]);
    expect(euro.monthlyTopUp).toBe(0);
    expect(euro.shortMonths).toHaveLength(12);
  });
});

describe('goalProgress', () => {
  const goal = { currency: 'UAH' as const, year: 2028, monthly: 2000 };
  const plan = planCouponGoal(wallet, bonds, goal, 16);
  const goalWallet = buildWallet(
    [
      ...purchases,
      ...plan.purchases.map((purchase, index) => ({ ...purchase, id: `goal-${index}` })),
    ],
    byIsin,
    today,
  );

  it('counts the months the goal plan reaches', () => {
    expect(goalProgress(wallet, goal).monthsOnGoal).toBe(0);
    // The months no bond pays in stay short.
    expect(goalProgress(goalWallet, goal).monthsOnGoal).toBe(4);
  });

  it('gives the own money a month from the planned purchases', () => {
    const progress = goalProgress(goalWallet, goal);
    expect(progress.plannedCount).toBe(plan.purchases.length);
    expect(progress.plannedAmount).toBeCloseTo(plan.cost, 2);
    expect(progress.topUpMonths).toBe(12);
    // Rounded up to whole units, as the goal's own top-up; the coupons of the new bonds in the
    // purchase year count as the plan's money too, so it is no more than the goal asked.
    expect(progress.monthlyTopUp).toBeLessThanOrEqual(plan.monthlyTopUp);
    expect(progress.monthlyTopUp).toBeGreaterThan(0);
  });
});
