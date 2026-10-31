import {
  type Bond,
  type CouponGoal,
  type Purchase,
  type Wallet,
  amountForYield,
  hasRedemption,
  newBondsRate,
} from '@/entities/portfolio';

import { addDaysISO, addMonthsISO, round2 } from '@/shared/lib';

/** Bonds placed this many months before today are the ones banks and brokers still sell. */
export const GOAL_BOND_MONTHS = 24;
/** How many years ahead a goal can be set. */
const GOAL_YEARS_AHEAD = 5;

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
  /** Its coupons in the goal's year */
  coupons: number;
  /** The months of the goal's year it pays a coupon in, 0–11 */
  months: number[];
  /** The annual yield its price is estimated at, % */
  marketYield: number;
};

/** A purchase the goal adds to a plan. */
export type GoalPurchase = Omit<Purchase, 'id'>;

export type CouponGoalPlan = {
  /** The purchases' span: what is left of the year before the goal's */
  from: string;
  to: string;
  /** The goal's year, month by month */
  months: GoalMonth[];
  bonds: GoalBond[];
  /** By date */
  purchases: GoalPurchase[];
  cost: number;
  /** The plan's own payments (coupons and redemptions) in the purchases' span, spent first */
  planMoney: number;
  /** Money of one's own added at the start of each month of the span */
  monthlyTopUp: number;
  topUpMonths: number;
  /** What is left of the plan's money and the top-ups once everything is bought */
  leftover: number;
  /** Months still short of the goal, 0–11: no bond for sale pays a coupon in them */
  shortMonths: number[];
};

/** The purchases' span for a goal's year: from tomorrow at the earliest to the end of the year before. */
export function goalPurchaseSpan(year: number, today: string): { from: string; to: string } {
  const start = `${year - 1}-01-01`;
  const tomorrow = addDaysISO(today, 1);
  return { from: tomorrow > start ? tomorrow : start, to: `${year - 1}-12-31` };
}

/** The years a goal can be set for: those with some days left to buy in the year before. */
export function goalYears(today: string): number[] {
  const thisYear = Number(today.slice(0, 4));
  return Array.from({ length: GOAL_YEARS_AHEAD }, (_, index) => thisYear + 1 + index).filter(
    (year) => {
      const { from, to } = goalPurchaseSpan(year, today);
      return from <= to;
    },
  );
}

/** A bond the goal can buy, with what it pays in the goal's year and what it is priced at. */
type Candidate = {
  bond: Bond;
  /** Coupons of one bond in each month of the goal's year */
  coupons: number[];
  marketYield: number;
  /** Prices already worked out, by date: the search for the top-up asks for the same days often */
  prices: Map<string, number>;
};

const monthOf = (date: string) => Number(date.slice(5, 7)) - 1;

function couponsByMonth(bond: Bond, year: number): number[] {
  const months = Array.from({ length: 12 }, () => 0);
  for (const payment of bond.payments) {
    if (payment.type === 'coupon' && payment.date.startsWith(`${year}-`)) {
      months[monthOf(payment.date)] += payment.amount;
    }
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
 * schedule is published, that are still held through the goal's year and pay coupons in it. Each is
 * priced at today's yield of new bonds of its term, the key rate without them for hryvnia bonds,
 * its own coupon rate otherwise.
 */
function goalCandidates(
  bonds: Bond[],
  goal: CouponGoal,
  today: string,
  keyRate: number | null,
): Candidate[] {
  const since = addMonthsISO(today, -GOAL_BOND_MONTHS);
  const yearEnd = `${goal.year}-12-31`;
  return bonds
    .filter(
      (bond) =>
        bond.currency === goal.currency &&
        bond.issueDate > since &&
        bond.issueDate <= today &&
        bond.maturityDate > yearEnd &&
        hasRedemption(bond),
    )
    .map((bond) => ({
      bond,
      coupons: couponsByMonth(bond, goal.year),
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

/**
 * Buys the bonds as money comes in, one bond after another, as many whole bonds as the cash allows
 * at each day's price. `done` tells whether all of them were bought.
 */
function buyAsFunded(
  choices: Choice[],
  funding: Funding[],
): { purchases: GoalPurchase[]; done: boolean } {
  const queue = choices.map((choice) => ({ ...choice }));
  const purchases: GoalPurchase[] = [];
  let cash = 0;
  for (const { date, amount } of funding) {
    cash = round2(cash + amount);
    while (queue.length) {
      const next = queue[0];
      const price = priceOn(next.candidate, date);
      const quantity = Math.min(next.quantity, Math.floor(cash / price));
      if (quantity === 0) break;
      const cost = round2(price * quantity);
      purchases.push({
        isin: next.candidate.bond.isin,
        purchaseDate: date,
        quantity,
        amount: cost,
        currency: next.candidate.bond.currency,
      });
      cash = round2(cash - cost);
      next.quantity -= quantity;
      if (next.quantity === 0) queue.shift();
    }
  }
  return { purchases, done: queue.length === 0 };
}

/** The first day of each month of the span, the span's first day for its first month. */
function monthStarts(from: string, to: string): string[] {
  const starts: string[] = [];
  for (let start = `${from.slice(0, 7)}-01`; start <= to; start = addMonthsISO(start, 1)) {
    starts.push(start < from ? from : start);
  }
  return starts;
}

/**
 * What to buy in the year before the goal's so that the plan's coupons reach `goal.monthly` in every
 * month of the goal's year: the bonds and their purchases, dated as money comes in. The plan's own
 * coupons and redemptions in that span pay first; the rest is the smallest equal top-up, in whole
 * units of the currency, at the start of each month. Prices are estimates at today's market yield.
 */
export function planCouponGoal(
  wallet: Wallet,
  bonds: Bond[],
  goal: CouponGoal,
  keyRate: number | null,
): CouponGoalPlan {
  const { today } = wallet;
  const { from, to } = goalPurchaseSpan(goal.year, today);
  const payments = wallet.payments.filter((payment) => payment.currency === goal.currency);

  const planCoupons = Array.from({ length: 12 }, () => 0);
  for (const payment of payments) {
    if (payment.type === 'coupon' && payment.date.startsWith(`${goal.year}-`)) {
      planCoupons[monthOf(payment.date)] += payment.total;
    }
  }
  const gaps = planCoupons.map((coupons) => Math.max(0, round2(goal.monthly - coupons)));
  const candidates = goalCandidates(bonds, goal, today, keyRate);
  const { choices, shortMonths } = chooseBonds(candidates, gaps, from);

  const inflows = payments
    .filter((payment) => payment.date >= from && payment.date <= to)
    .map((payment) => ({ date: payment.date, amount: payment.total }));
  const planMoney = round2(inflows.reduce((sum, inflow) => sum + inflow.amount, 0));
  const starts = monthStarts(from, to);
  const fund = (topUp: number) => {
    // Money that comes on the same day is spent together, so a day buys each bond at most once.
    const byDate = new Map<string, number>();
    for (const { date, amount } of [
      ...inflows,
      ...starts.map((date) => ({ date, amount: topUp })),
    ]) {
      byDate.set(date, (byDate.get(date) ?? 0) + amount);
    }
    const funding = [...byDate]
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return buyAsFunded(choices, funding);
  };

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
  const purchases = fund(monthlyTopUp).purchases;
  const cost = round2(purchases.reduce((sum, purchase) => sum + purchase.amount, 0));

  const goalBonds = choices.map(({ candidate, quantity }): GoalBond => {
    const own = purchases.filter((purchase) => purchase.isin === candidate.bond.isin);
    return {
      bond: candidate.bond,
      quantity,
      amount: round2(own.reduce((sum, purchase) => sum + purchase.amount, 0)),
      coupons: round2(candidate.coupons.reduce((sum, coupon) => sum + coupon * quantity, 0)),
      months: candidate.coupons.flatMap((coupon, month) => (coupon > 0 ? [month] : [])),
      marketYield: candidate.marketYield,
    };
  });
  const months = planCoupons.map((coupons, month): GoalMonth => ({
    plan: round2(coupons),
    added: round2(
      choices.reduce(
        (sum, { candidate, quantity }) => sum + candidate.coupons[month] * quantity,
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
    monthlyTopUp,
    topUpMonths: starts.length,
    leftover: round2(planMoney + monthlyTopUp * starts.length - cost),
    shortMonths,
  };
}

/** Where a plan stands against its saved goal: the card on the plans tab. */
export type GoalProgress = {
  /** «Місяців з ціллю»: months of the goal's year whose coupons reach the goal */
  monthsOnGoal: number;
  /** Planned purchases still ahead in the purchase year */
  plannedCount: number;
  plannedAmount: number;
  /** «Власні кошти на місяць»: those purchases less the plan's money, over the months left */
  monthlyTopUp: number;
  topUpMonths: number;
};

/**
 * The plan as it stands against its goal. The own money follows the purchases as they are
 * confirmed: what the planned purchases of the purchase year cost beyond the plan's coupons and
 * redemptions in what is left of it, spread over its months.
 */
export function goalProgress(wallet: Wallet, goal: CouponGoal): GoalProgress {
  const { today } = wallet;
  const { from, to } = goalPurchaseSpan(goal.year, today);
  const inCurrency = <T extends { currency: string }>(items: T[]) =>
    items.filter((item) => item.currency === goal.currency);
  const coupons = Array.from({ length: 12 }, () => 0);
  for (const payment of inCurrency(wallet.payments)) {
    if (payment.type === 'coupon' && payment.date.startsWith(`${goal.year}-`)) {
      coupons[monthOf(payment.date)] += payment.total;
    }
  }
  const inSpan = (date: string) => date >= from && date <= to;
  const planned = inCurrency(wallet.purchaseEvents).filter((event) => inSpan(event.date));
  const plannedAmount = round2(planned.reduce((sum, event) => sum + event.total, 0));
  const planMoney = inCurrency(wallet.payments)
    .filter((payment) => inSpan(payment.date))
    .reduce((sum, payment) => sum + payment.total, 0);
  const topUpMonths = from <= to ? monthStarts(from, to).length : 0;
  return {
    monthsOnGoal: coupons.filter((sum) => round2(sum) >= goal.monthly).length,
    plannedCount: planned.length,
    plannedAmount,
    monthlyTopUp:
      topUpMonths > 0 ? Math.ceil(Math.max(0, plannedAmount - planMoney) / topUpMonths) : 0,
    topUpMonths,
  };
}
