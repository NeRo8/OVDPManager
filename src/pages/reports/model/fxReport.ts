import {
  type Bond,
  type Purchase,
  type ScheduleEvent,
  type Wallet,
  compareScheduleEvents,
} from '@/entities/portfolio';
import { monthRange, monthsBetween, round2 } from '@/shared/lib';

export type FxEvent = {
  key: string;
  date: string;
  isin: string;
  type: ScheduleEvent['type'];
  /** Money paid or received in hryvnia. */
  amount: number;
  /** Official hryvnia per one unit of the report currency. */
  rate: number;
  equivalent: number;
};

export type FxBond = {
  isin: string;
  events: FxEvent[];
  invested: number;
  received: number;
  /** Available only after the bond's published redemption has passed. */
  result: number | null;
};

export type FxPoint = {
  /** Calendar month represented by this point. */
  period: string;
  /** All purchases through this point, converted at each purchase date. */
  investedFx: number;
  /** Remaining UAH purchase cost at the point's date, plus payouts at their payment-date FX. */
  currentFx: number;
};

export type FxYear = {
  year: number;
  purchases: number;
  coupons: number;
  redemptions: number;
  balance: number;
};

export type FxReport = {
  /** A calendar year, or every past event when null. */
  year: number | null;
  fromDate: string;
  throughDate: string;
  bonds: FxBond[];
  points: FxPoint[];
  years: FxYear[];
  purchases: number;
  coupons: number;
  redemptions: number;
  /** All selected bonds' cash flows through the report date, including earlier years. */
  snapshot: {
    invested: number;
    received: number;
    /** Unrepaid UAH purchase cost converted at the report-date rate, not a market price. */
    remainingCost: number;
    /** Cumulative payouts plus remaining cost; includes payouts that were reinvested. */
    payoutsAndRemaining: number;
    estimatedDifference: number;
  };
  /** Cash received minus cash paid in the chosen period, not the gain on open bonds. */
  balance: number;
  completedResult: number;
  completedCount: number;
  openCount: number;
};

function throughDateFor(wallet: Wallet, year: number | null): string {
  return year === null || `${year}-12-31` >= wallet.today ? wallet.today : `${year}-12-31`;
}

function pastEvents(wallet: Wallet, year: number | null): ScheduleEvent[] {
  const throughDate = throughDateFor(wallet, year);
  const eligible = [...wallet.purchaseEvents, ...wallet.payments].filter(
    (event) =>
      event.currency === 'UAH' &&
      event.date <= throughDate &&
      (event.type === 'purchase' || event.isPaid),
  );
  if (year === null) return eligible.sort(compareScheduleEvents);
  const activeIsins = new Set(
    eligible.filter((event) => event.date.startsWith(String(year))).map((event) => event.isin),
  );
  return eligible.filter((event) => activeIsins.has(event.isin)).sort(compareScheduleEvents);
}

function monthEnd(month: string, throughDate: string): string {
  const end = monthRange(`${month}-01`).to;
  return end < throughDate ? end : throughDate;
}

function pointDates(fromDate: string, throughDate: string): string[] {
  return monthsBetween(fromDate, throughDate).map((month) => monthEnd(month, throughDate));
}

function reportSpan(wallet: Wallet, year: number | null) {
  const events = pastEvents(wallet, year);
  const throughDate = throughDateFor(wallet, year);
  const fromDate = year === null ? (events[0]?.date ?? throughDate) : `${year}-01-01`;
  return { events, fromDate, throughDate };
}

/** Dates that need official rates: cash flows and each chart valuation. */
export function fxEventDates(wallet: Wallet, year: number | null): string[] {
  const { events, fromDate, throughDate } = reportSpan(wallet, year);
  if (events.length === 0) return [];
  return [...new Set([...events.map((event) => event.date), ...pointDates(fromDate, throughDate)])];
}

/** Reduce purchase cost when the bond returns part or all of its nominal. */
function remainingCost(
  purchase: Purchase,
  bond: Bond | undefined,
  date: string,
  today: string,
): number {
  if (purchase.purchaseDate > date) return 0;
  if (!bond) return purchase.amount;
  const remainingNominal = (onDate: string) =>
    Math.max(
      0,
      bond.nominal -
        bond.payments
          .filter(
            (payment) =>
              payment.type === 'redemption' &&
              payment.date <= onDate &&
              (payment.date < today || payment.date <= purchase.purchaseDate),
          )
          .reduce((sum, payment) => sum + payment.amount, 0),
    );
  const purchasedNominal = remainingNominal(purchase.purchaseDate);
  return purchasedNominal > 0 ? (purchase.amount * remainingNominal(date)) / purchasedNominal : 0;
}

/** Cash flows of UAH bonds measured in a foreign currency at each event's past date. */
export function fxReport(
  wallet: Wallet,
  year: number | null,
  rateOn: (date: string) => number | null,
): FxReport | null {
  const { events, fromDate, throughDate } = reportSpan(wallet, year);
  if (events.length === 0) {
    return {
      year,
      fromDate,
      throughDate,
      bonds: [],
      points: [],
      years: [],
      purchases: 0,
      coupons: 0,
      redemptions: 0,
      snapshot: {
        invested: 0,
        received: 0,
        remainingCost: 0,
        payoutsAndRemaining: 0,
        estimatedDifference: 0,
      },
      balance: 0,
      completedResult: 0,
      completedCount: 0,
      openCount: 0,
    };
  }
  const converted: FxEvent[] = [];
  for (const event of events) {
    const rate = rateOn(event.date);
    if (rate === null || rate <= 0) return null;
    converted.push({
      key: event.type === 'purchase' ? event.id : `${event.isin}-${event.date}-${event.type}`,
      date: event.date,
      isin: event.isin,
      type: event.type,
      amount: event.total,
      rate,
      equivalent: round2(event.total / rate),
    });
  }

  const periodEvents =
    year === null ? converted : converted.filter((event) => event.date.startsWith(String(year)));
  const reportIsins = new Set(periodEvents.map((event) => event.isin));
  const total = (items: FxEvent[], type: FxEvent['type']) =>
    round2(
      items
        .filter((event) => event.type === type)
        .reduce((sum, event) => sum + event.equivalent, 0),
    );
  const purchases = total(periodEvents, 'purchase');
  const coupons = total(periodEvents, 'coupon');
  const redemptions = total(periodEvents, 'redemption');
  const years: FxYear[] = [];
  if (year === null) {
    for (
      let value = Number(fromDate.slice(0, 4));
      value <= Number(throughDate.slice(0, 4));
      value++
    ) {
      const inYear = periodEvents.filter((event) => event.date.startsWith(String(value)));
      const yearPurchases = total(inYear, 'purchase');
      const yearCoupons = total(inYear, 'coupon');
      const yearRedemptions = total(inYear, 'redemption');
      years.push({
        year: value,
        purchases: yearPurchases,
        coupons: yearCoupons,
        redemptions: yearRedemptions,
        balance: round2(yearCoupons + yearRedemptions - yearPurchases),
      });
    }
  }
  const points: FxPoint[] = [];
  for (const date of pointDates(fromDate, throughDate)) {
    const rate = rateOn(date);
    if (rate === null || rate <= 0) return null;
    const investedFx = round2(
      converted
        .filter((event) => event.type === 'purchase' && event.date <= date)
        .reduce((sum, event) => sum + event.equivalent, 0),
    );
    const receivedFx = converted
      .filter((event) => event.type !== 'purchase' && event.date <= date)
      .reduce((sum, event) => sum + event.equivalent, 0);
    const remainingUah = wallet.positions
      .filter(({ position }) => reportIsins.has(position.isin))
      .flatMap(({ position, bond }) =>
        position.purchases.map((purchase) => remainingCost(purchase, bond, date, wallet.today)),
      )
      .reduce((sum, cost) => sum + cost, 0);
    points.push({
      period: date.slice(0, 7),
      investedFx,
      currentFx: round2(receivedFx + remainingUah / rate),
    });
  }
  const bonds = wallet.positions
    .filter(({ position }) => reportIsins.has(position.isin))
    .map(({ position, bond }): FxBond => {
      const bondEvents = converted.filter((event) => event.isin === position.isin);
      const invested = round2(
        bondEvents
          .filter((event) => event.type === 'purchase')
          .reduce((sum, event) => sum + event.equivalent, 0),
      );
      const received = round2(
        bondEvents
          .filter((event) => event.type !== 'purchase')
          .reduce((sum, event) => sum + event.equivalent, 0),
      );
      const completed =
        bond !== undefined &&
        bond.maturityDate <= throughDate &&
        bond.maturityDate < wallet.today &&
        bond.payments.some(
          (payment) => payment.type === 'redemption' && payment.date === bond.maturityDate,
        );
      return {
        isin: position.isin,
        events: periodEvents.filter((event) => event.isin === position.isin),
        invested,
        received,
        result: completed ? round2(received - invested) : null,
      };
    });
  const completed = bonds.filter((bond) => bond.result !== null);
  const lastPoint = points[points.length - 1];
  const invested = lastPoint.investedFx;
  const received = round2(
    converted
      .filter((event) => event.type !== 'purchase')
      .reduce((sum, event) => sum + event.equivalent, 0),
  );
  const remainingCostFx = round2(lastPoint.currentFx - received);
  const payoutsAndRemaining = round2(received + remainingCostFx);

  return {
    year,
    fromDate,
    throughDate,
    bonds,
    points,
    years,
    purchases,
    coupons,
    redemptions,
    snapshot: {
      invested,
      received,
      remainingCost: remainingCostFx,
      payoutsAndRemaining,
      estimatedDifference: round2(payoutsAndRemaining - invested),
    },
    balance: round2(coupons + redemptions - purchases),
    completedResult: round2(completed.reduce((sum, bond) => sum + (bond.result ?? 0), 0)),
    completedCount: completed.length,
    openCount: bonds.length - completed.length,
  };
}
