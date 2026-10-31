import { type Bond, type CouponGoal, type Purchase, buildWallet } from '@/entities/portfolio';

import { planCouponGoal } from '../couponGoal';
import { goalProgress } from '../goalProgress';
import {
  fitPurchaseYears,
  goalMonthIndex,
  goalPurchaseSpan,
  goalPurchaseYears,
  goalYears,
} from '../goalSpans';

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
// Matures within the goal's year, after its March and September coupons.
const soon = bondOf('UA4000000004', '2026-05-01', '2028-09-01', 16);
// Another currency.
const dollar = bondOf('UA4000000005', '2026-02-01', '2029-06-13', 4, 'USD');
// Held: repaid in March of the purchase year.
const held = bondOf('UA4000000006', '2025-12-01', '2027-03-24', 15.68);

// Pays in June and December, long after the goal's years start.
const long = bondOf('UA4000000007', '2026-06-10', '2031-06-10', 17);

const bonds = [janJul, aprOct, old, soon, dollar, held, long];
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

/** Coupons in 2028, bought in 2027, the plan's payments reinvested. */
const goal: CouponGoal = {
  currency: 'UAH',
  year: 2028,
  incomeYears: 1,
  purchaseYears: 1,
  monthly: 2000,
  reinvest: true,
};
const isins = (plan: ReturnType<typeof planCouponGoal>) =>
  plan.bonds.map(({ bond, quantity }) => [bond.isin, quantity]);

describe('the goal’s years', () => {
  it('lets coupons start in any of the five years after this one', () => {
    expect(goalYears(today)).toEqual([2027, 2028, 2029, 2030, 2031]);
  });

  it('leaves out next year once nothing is left of this one to buy in', () => {
    expect(goalYears('2026-12-31')).toEqual([2028, 2029, 2030, 2031]);
  });

  it('buys in the years right before the coupons, from tomorrow at the earliest', () => {
    expect(goalPurchaseSpan({ year: 2028, purchaseYears: 1 }, today)).toEqual({
      from: '2027-01-01',
      to: '2027-12-31',
    });
    expect(goalPurchaseSpan({ year: 2029, purchaseYears: 2 }, today)).toEqual({
      from: '2027-01-01',
      to: '2028-12-31',
    });
    expect(goalPurchaseSpan({ year: 2028, purchaseYears: 2 }, today)).toEqual({
      from: '2026-11-01',
      to: '2027-12-31',
    });
  });

  it('offers up to three years to buy in, none before this one', () => {
    expect(goalPurchaseYears(2027, today)).toEqual([1]);
    expect(goalPurchaseYears(2028, today)).toEqual([1, 2]);
    expect(goalPurchaseYears(2031, today)).toEqual([1, 2, 3]);
    expect(goalPurchaseYears(2028, '2026-12-31')).toEqual([1]);
    expect(fitPurchaseYears(2027, 3, today)).toBe(1);
    expect(fitPurchaseYears(2031, 2, today)).toBe(2);
  });

  it('counts the months of the coupon years from the first January', () => {
    const span = { year: 2029, incomeYears: 2 };
    expect(goalMonthIndex(span, '2029-01-25')).toBe(0);
    expect(goalMonthIndex(span, '2030-12-10')).toBe(23);
    expect(goalMonthIndex(span, '2028-12-31')).toBe(-1);
    expect(goalMonthIndex(span, '2031-01-01')).toBe(-1);
  });
});

describe('planCouponGoal', () => {
  const plan = planCouponGoal(wallet, bonds, goal, 16);

  it('takes the plan’s coupons and closes each month’s shortfall', () => {
    expect(plan.months[0]).toEqual({ plan: 800, added: 1200 });
    expect(plan.months[2]).toEqual({ plan: 0, added: 2000 });
    expect(plan.months[3]).toEqual({ plan: 0, added: 2000 });
    expect(plan.months[5]).toEqual({ plan: 0, added: 2040 });
    expect(plan.months[6]).toEqual({ plan: 800, added: 1200 });
  });

  it('buys only bonds for sale in the currency, one maturing in the year for the months before', () => {
    expect(isins(plan)).toEqual([
      [soon.isin, 25],
      [aprOct.isin, 25],
      [long.isin, 24],
      [janJul.isin, 15],
    ]);
  });

  it('names the months no such bond pays in', () => {
    expect(plan.shortMonths).toEqual([1, 4, 7, 10]);
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

  it('reinvests the plan’s payments and the coupons of the bonds just bought', () => {
    // The held bond's last coupon and its redemption, and the January and July coupons.
    expect(plan.planMoney).toBe(1646.4 + 21000 + 800 + 800);
    expect(plan.goalMoney).toBeGreaterThan(0);
    expect(plan.topUpMonths).toBe(12);
    expect(plan.monthlyTopUp).toBeGreaterThan(0);
    expect(plan.leftover).toBeGreaterThanOrEqual(0);
    expect(plan.cost).toBeCloseTo(
      plan.planMoney + plan.goalMoney + plan.monthlyTopUp * 12 - plan.leftover,
      2,
    );
    // The bonds bought in March pay their April coupon, which buys one more.
    expect(plan.purchases.some((p) => p.purchaseDate === '2027-04-25')).toBe(true);
  });

  it('pays first for the purchases the plan already has planned in those years', () => {
    // The plan already means to spend the March redemption on twenty more bonds.
    const busy = buildWallet(
      [
        ...purchases,
        {
          id: '3',
          isin: aprOct.isin,
          purchaseDate: '2027-03-25',
          amount: 20000,
          quantity: 20,
          currency: 'UAH',
        },
      ],
      byIsin,
      today,
    );
    const crowded = planCouponGoal(busy, bonds, goal, 16);
    expect(crowded.plannedCost).toBe(20000);
    expect(crowded.monthlyTopUp).toBeGreaterThan(plan.monthlyTopUp);
    expect(crowded.leftover).toBeGreaterThanOrEqual(0);
    expect(crowded.cost + crowded.plannedCost).toBeCloseTo(
      crowded.planMoney + crowded.goalMoney + crowded.monthlyTopUp * 12 - crowded.leftover,
      2,
    );
  });

  it('without reinvesting pays only with money of one’s own, at the start of each month', () => {
    const own = planCouponGoal(wallet, bonds, { ...goal, reinvest: false }, 16);
    expect(isins(own)).toEqual(isins(plan));
    expect(own.purchases.every((p) => p.purchaseDate.endsWith('-01'))).toBe(true);
    expect(own.monthlyTopUp).toBeGreaterThan(plan.monthlyTopUp);
    expect(own.cost).toBeCloseTo(own.monthlyTopUp * 12 - own.leftover, 2);
    // What is taken out is still counted, for the screen to show.
    expect(own.planMoney).toBe(plan.planMoney);
    expect(own.goalMoney).toBeGreaterThan(0);
  });

  it('needs no money of one’s own when the plan’s money covers the purchases', () => {
    const small = planCouponGoal(wallet, bonds, { ...goal, monthly: 500 }, 16);
    expect(small.monthlyTopUp).toBe(0);
    // The January coupon buys no whole bond; the March redemption buys them all.
    expect(small.purchases.every((p) => p.purchaseDate === '2027-03-24')).toBe(true);
  });

  it('spreads the goal over several years, bought over the years before', () => {
    const twoYears = planCouponGoal(
      wallet,
      bonds,
      { ...goal, year: 2029, incomeYears: 2, purchaseYears: 2, monthly: 1000 },
      16,
    );
    expect(twoYears.months).toHaveLength(24);
    expect(twoYears.topUpMonths).toBe(24);
    expect([twoYears.from, twoYears.to]).toEqual(['2027-01-01', '2028-12-31']);
    // January–July bonds mature in July 2029: they close January and July of 2029 only.
    expect(twoYears.months[0].added).toBeGreaterThan(0);
    expect(twoYears.months[12].added).toBe(0);
    expect(twoYears.shortMonths).toContain(12);
    // The long bond pays June and December of both years.
    expect(twoYears.months[17]).toEqual({ plan: 0, added: 1020 });
    expect(twoYears.months[23]).toEqual({ plan: 0, added: 1020 });
    expect(twoYears.bonds.find(({ bond }) => bond.isin === long.isin)?.months).toEqual([5, 11]);
  });

  it('buys nothing in a currency with no bonds for the goal', () => {
    const euro = planCouponGoal(wallet, bonds, { ...goal, currency: 'EUR', monthly: 100 }, 16);
    expect(euro.purchases).toEqual([]);
    expect(euro.monthlyTopUp).toBe(0);
    expect(euro.shortMonths).toHaveLength(12);
  });
});

describe('goalProgress', () => {
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
    expect(goalProgress(wallet, goal)).toMatchObject({ monthsOnGoal: 0, goalMonths: 12 });
    // The months no bond pays in stay short.
    expect(goalProgress(goalWallet, goal).monthsOnGoal).toBe(8);
  });

  it('gives the own money a month from the planned purchases', () => {
    const progress = goalProgress(goalWallet, goal);
    expect(progress).toMatchObject({ from: '2027-01-01', to: '2027-12-31', topUpMonths: 12 });
    expect(progress.plannedCount).toBe(plan.purchases.length);
    expect(progress.plannedAmount).toBeCloseTo(plan.cost, 2);
    // Rounded up to whole units, as the goal's own top-up; the order of payments is not followed.
    expect(progress.monthlyTopUp).toBeLessThanOrEqual(plan.monthlyTopUp);
    expect(progress.monthlyTopUp).toBeGreaterThan(0);
  });

  it('spreads the purchases over own money alone when payments are taken out', () => {
    const progress = goalProgress(goalWallet, { ...goal, reinvest: false });
    expect(progress.monthlyTopUp).toBe(Math.ceil(progress.plannedAmount / 12));
  });
});
