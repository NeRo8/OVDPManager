import {
  type Bond,
  type CouponGoal,
  type Purchase,
  type Wallet,
  amountForYield,
  hasRedemption,
  newBondsRate,
} from '@/entities/portfolio';

import { addMonthsISO, round2 } from '@/shared/lib';

import { goalMonthIndex, goalPurchaseSpan, monthStarts } from './goalSpans';

/** Bonds placed this many months before today are the ones banks and brokers still sell. */
export const GOAL_BOND_MONTHS = 24;

export type GoalMonth = {
  /** The plan's coupons as it stands */
  plan: number;
  /** Coupons of the bonds the goal adds */
  added: number;
};

/** One bond the goal buys, all its purchases together. */
export type GoalBond = {
  bond: Bond;
  quantity: number;
  /** What its purchases cost */
  amount: number;
  /** Its coupons over «Роки купонів» */
  coupons: number;
  /** The months of the year it pays a coupon in during «Роки купонів», 0–11 */
  months: number[];
  /** The annual yield its price is estimated at, % */
  marketYield: number;
};

/** A purchase the goal adds to a plan. */
export type GoalPurchase = Omit<Purchase, 'id'>;

export type CouponGoalPlan = {
  /** «Роки купівель», what is left of them */
  from: string;
  to: string;
  /** «Роки купонів», month by month */
  months: GoalMonth[];
  bonds: GoalBond[];
  /** By date */
  purchases: GoalPurchase[];
  cost: number;
  /** The plan's own payments (coupons and redemptions) in «Роки купівель» */
  planMoney: number;
  /** Payments of the bonds the goal buys that come before «Роки купівель» end */
  goalMoney: number;
  /** Money of one's own added at the start of each month of «Роки купівель» */
  monthlyTopUp: number;
  topUpMonths: number;
  /** What is left of the money spent on the purchases once everything is bought */
  leftover: number;
  /** Months of «Роки купонів» still short of the goal, as indexes of `months`: no bond pays in them */
  shortMonths: number[];
};

/** A bond the goal can buy, with what it pays in «Роки купонів» and what it is priced at. */
type Candidate = {
  bond: Bond;
  /** Coupons of one bond in each month of «Роки купонів» */
  coupons: number[];
  marketYield: number;
  /** Prices already worked out, by date: the search for the top-up asks for the same days often */
  prices: Map<string, number>;
};

/** Coupons of one bond in each month of «Роки купонів». */
function couponsByMonth(bond: Bond, goal: CouponGoal): number[] {
  const months = Array.from({ length: goal.incomeYears * 12 }, () => 0);
  for (const payment of bond.payments) {
    const index = goalMonthIndex(goal, payment.date);
    if (payment.type === 'coupon' && index >= 0) months[index] += payment.amount;
  }
  return months;
}

/** One bond's price on a date at the yield: what its payments after that day are worth. */
function priceOn({ bond, marketYield, prices }: Candidate, date: string): number {
  const known = prices.get(date);
  if (known !== undefined) return known;
  const payments = bond.payments
    .filter((payment) => payment.date > date)
    .map((payment) => ({ date: payment.date, total: payment.amount }));
  const price = amountForYield(date, payments, marketYield);
  prices.set(date, price);
  return price;
}

/**
 * Bonds of the goal's currency placed lately (older issues sit with the NBU and banks), whose whole
 * schedule is published and that pay coupons in «Роки купонів»; one that matures among them closes
 * the months before it. Each is priced at today's yield of new bonds of its term, the key rate
 * without them for hryvnia bonds, its own coupon rate otherwise.
 */
function goalCandidates(
  bonds: Bond[],
  goal: CouponGoal,
  today: string,
  keyRate: number | null,
): Candidate[] {
  const since = addMonthsISO(today, -GOAL_BOND_MONTHS);
  return bonds
    .filter(
      (bond) =>
        bond.currency === goal.currency &&
        bond.issueDate > since &&
        bond.issueDate <= today &&
        hasRedemption(bond),
    )
    .map((bond) => ({
      bond,
      coupons: couponsByMonth(bond, goal),
      marketYield:
        newBondsRate(bond, today, bonds)?.rate ??
        (bond.currency === 'UAH' ? keyRate : null) ??
        bond.rate,
      prices: new Map<string, number>(),
    }))
    .filter(({ coupons }) => coupons.some((amount) => amount > 0));
}

/** How many bonds pay at least `gap` with `coupon` each; float noise does not add one. */
const bondsFor = (gap: number, coupon: number) => Math.ceil(Number((gap / coupon).toFixed(6)));

type Choice = { candidate: Candidate; quantity: number };

/**
 * Fills the months short of the goal, the largest gap first. For that month it takes the bond that
 * pays the most toward the gaps per hryvnia spent, enough of it to close the month; its other
 * coupons go toward their own months. A month no bond pays in stays short.
 */
function chooseBonds(
  candidates: Candidate[],
  gaps: number[],
  from: string,
): { choices: Choice[]; shortMonths: number[] } {
  const left = [...gaps];
  const short = new Set<number>();
  const choices = new Map<string, Choice>();
  for (;;) {
    let month = -1;
    left.forEach((gap, index) => {
      if (gap > 0 && !short.has(index) && (month < 0 || gap > left[month])) month = index;
    });
    if (month < 0) break;
    const options = candidates
      .filter(({ coupons }) => coupons[month] > 0)
      .map((candidate) => {
        const quantity = bondsFor(left[month], candidate.coupons[month]);
        const useful = candidate.coupons.reduce(
          (sum, coupon, index) => sum + Math.min(coupon * quantity, left[index]),
          0,
        );
        return { candidate, quantity, score: useful / (quantity * priceOn(candidate, from)) };
      });
    if (!options.length) {
      short.add(month);
      continue;
    }
    const best = options.reduce((first, second) =>
      second.score > first.score ||
      (second.score === first.score && second.candidate.bond.rate > first.candidate.bond.rate)
        ? second
        : first,
    );
    const { candidate, quantity } = best;
    candidate.coupons.forEach((coupon, index) => {
      left[index] = Math.max(0, round2(left[index] - coupon * quantity));
    });
    const chosen = choices.get(candidate.bond.isin);
    choices.set(candidate.bond.isin, {
      candidate,
      quantity: (chosen?.quantity ?? 0) + quantity,
    });
  }
  return { choices: [...choices.values()], shortMonths: [...short].sort((a, b) => a - b) };
}

type Funding = { date: string; amount: number };

type Funded = {
  purchases: GoalPurchase[];
  done: boolean;
  /** Payments of the bonds bought that come by `to` */
  goalMoney: number;
};

/**
 * Buys the bonds as money comes in, one bond after another, as many whole bonds as the cash allows
 * at each day's price. A bond bought pays its coupons and redemption from the next payment on (the
 * one on the day of purchase is the seller's); with `reinvest` those that come by `to` are cash for
 * the next purchases. `done` tells whether all of them were bought.
 */
function buyAsFunded(choices: Choice[], funding: Funding[], to: string, reinvest: boolean): Funded {
  const queue = choices.map((choice) => ({ ...choice }));
  const purchases: GoalPurchase[] = [];
  // Money that comes on the same day is spent together, so a day buys each bond at most once.
  const incoming = new Map<string, number>();
  const receive = (date: string, amount: number) =>
    incoming.set(date, (incoming.get(date) ?? 0) + amount);
  for (const { date, amount } of funding) receive(date, amount);
  let cash = 0;
  let goalMoney = 0;
  while (incoming.size) {
    const date = [...incoming.keys()].reduce((first, next) => (next < first ? next : first));
    cash = round2(cash + (incoming.get(date) ?? 0));
    incoming.delete(date);
    while (queue.length) {
      const next = queue[0];
      const { bond } = next.candidate;
      const price = priceOn(next.candidate, date);
      const quantity = Math.min(next.quantity, Math.floor(cash / price));
      if (quantity === 0) break;
      const cost = round2(price * quantity);
      purchases.push({
        isin: bond.isin,
        purchaseDate: date,
        quantity,
        amount: cost,
        currency: bond.currency,
      });
      for (const payment of bond.payments) {
        if (payment.date <= date || payment.date > to) continue;
        const amount = payment.amount * quantity;
        goalMoney += amount;
        if (reinvest) receive(payment.date, amount);
      }
      cash = round2(cash - cost);
      next.quantity -= quantity;
      if (next.quantity === 0) queue.shift();
    }
  }
  return { purchases, done: queue.length === 0, goalMoney: round2(goalMoney) };
}

/**
 * What to buy in «Роки купівель» so that the plan's coupons reach `goal.monthly` in every month of
 * «Роки купонів»: the bonds and their purchases, dated as money comes in. With `goal.reinvest` the
 * plan's coupons and redemptions in that span pay first, and so do those of the bonds just bought;
 * without it they are taken out and only money of one's own pays. That is the smallest equal top-up,
 * in whole units of the currency, at the start of each month. Prices are estimates at today's market
 * yield.
 */
export function planCouponGoal(
  wallet: Wallet,
  bonds: Bond[],
  goal: CouponGoal,
  keyRate: number | null,
): CouponGoalPlan {
  const { today } = wallet;
  const span = goalPurchaseSpan(goal, today);
  const { from, to } = span;
  const payments = wallet.payments.filter((payment) => payment.currency === goal.currency);

  const planCoupons = Array.from({ length: goal.incomeYears * 12 }, () => 0);
  for (const payment of payments) {
    const index = goalMonthIndex(goal, payment.date);
    if (payment.type === 'coupon' && index >= 0) planCoupons[index] += payment.total;
  }
  const gaps = planCoupons.map((coupons) => Math.max(0, round2(goal.monthly - coupons)));
  const candidates = goalCandidates(bonds, goal, today, keyRate);
  const { choices, shortMonths } = chooseBonds(candidates, gaps, from);

  const inflows = payments
    .filter((payment) => payment.date >= from && payment.date <= to)
    .map((payment) => ({ date: payment.date, amount: payment.total }));
  const planMoney = round2(inflows.reduce((sum, inflow) => sum + inflow.amount, 0));
  const starts = monthStarts(span);
  const fund = (topUp: number) =>
    buyAsFunded(
      choices,
      [...(goal.reinvest ? inflows : []), ...starts.map((date) => ({ date, amount: topUp }))],
      to,
      goal.reinvest,
    );

  // All of it bought on the first day is always enough; search down for the smallest top-up.
  let low = 0;
  let high = Math.ceil(
    choices.reduce((sum, { candidate, quantity }) => sum + priceOn(candidate, from) * quantity, 0),
  );
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (fund(middle).done) high = middle;
    else low = middle + 1;
  }
  const monthlyTopUp = choices.length ? low : 0;
  const { purchases, goalMoney } = fund(monthlyTopUp);
  const cost = round2(purchases.reduce((sum, purchase) => sum + purchase.amount, 0));
  const spent = goal.reinvest ? planMoney + goalMoney : 0;

  const goalBonds = choices.map(({ candidate, quantity }): GoalBond => {
    const own = purchases.filter((purchase) => purchase.isin === candidate.bond.isin);
    return {
      bond: candidate.bond,
      quantity,
      amount: round2(own.reduce((sum, purchase) => sum + purchase.amount, 0)),
      coupons: round2(candidate.coupons.reduce((sum, coupon) => sum + coupon * quantity, 0)),
      months: [
        ...new Set(candidate.coupons.flatMap((coupon, index) => (coupon > 0 ? [index % 12] : []))),
      ].sort((a, b) => a - b),
      marketYield: candidate.marketYield,
    };
  });
  const months = planCoupons.map((coupons, index): GoalMonth => ({
    plan: round2(coupons),
    added: round2(
      choices.reduce(
        (sum, { candidate, quantity }) => sum + candidate.coupons[index] * quantity,
        0,
      ),
    ),
  }));

  return {
    from,
    to,
    months,
    bonds: goalBonds,
    purchases,
    cost,
    planMoney,
    goalMoney,
    monthlyTopUp,
    topUpMonths: starts.length,
    leftover: round2(spent + monthlyTopUp * starts.length - cost),
    shortMonths,
  };
}

/** The months of «Роки купонів» of one year: its slice of `months`. */
export const goalYearMonths = <T>(months: T[], goal: CouponGoal, year: number): T[] =>
  months.slice((year - goal.year) * 12, (year - goal.year + 1) * 12);
