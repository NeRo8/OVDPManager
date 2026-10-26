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

export type FxMonth = {
  month: string;
  purchases: number;
  coupons: number;
  redemptions: number;
  /** All purchases through month end, converted at each purchase date. */
  investedFx: number;
  /** Remaining UAH purchase cost at month-end FX, plus past payouts at their payment-date FX. */
  currentFx: number;
};

export type FxReport = {
  year: number;
  throughDate: string;
  bonds: FxBond[];
  months: FxMonth[];
  purchases: number;
  coupons: number;
  redemptions: number;
  /** Cash received minus cash paid within the year, not the gain on bonds still held. */
  yearBalance: number;
  completedResult: number;
  completedCount: number;
  openCount: number;
};

function throughDateFor(wallet: Wallet, year: number): string {
  return `${year}-12-31` < wallet.today ? `${year}-12-31` : wallet.today;
}

function pastEvents(wallet: Wallet, year: number): ScheduleEvent[] {
  const throughDate = throughDateFor(wallet, year);
  const eligible = [...wallet.purchaseEvents, ...wallet.payments].filter(
    (event) =>
      event.currency === 'UAH' &&
      event.date <= throughDate &&
      (event.type === 'purchase' || event.isPaid),
  );
  const activeIsins = new Set(
    eligible.filter((event) => event.date.startsWith(String(year))).map((event) => event.isin),
  );
  return eligible.filter((event) => activeIsins.has(event.isin)).sort(compareScheduleEvents);
}

function monthEnd(month: string, throughDate: string): string {
  const end = monthRange(`${month}-01`).to;
  return end < throughDate ? end : throughDate;
}

/** Dates that need official rates: cash flows and each past month-end valuation. */
export function fxEventDates(wallet: Wallet, year: number): string[] {
  const events = pastEvents(wallet, year);
  if (events.length === 0) return [];
  const throughDate = throughDateFor(wallet, year);
  return [
    ...new Set([
      ...events.map((event) => event.date),
      ...monthsBetween(`${year}-01-01`, throughDate).map((month) => monthEnd(month, throughDate)),
    ]),
  ];
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
  year: number,
  rateOn: (date: string) => number | null,
): FxReport | null {
  const events = pastEvents(wallet, year);
  const throughDate = throughDateFor(wallet, year);
  if (events.length === 0) {
    return {
      year,
      throughDate,
      bonds: [],
      months: [],
      purchases: 0,
      coupons: 0,
      redemptions: 0,
      yearBalance: 0,
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

  const yearEvents = converted.filter((event) => event.date.startsWith(String(year)));
  const reportIsins = new Set(yearEvents.map((event) => event.isin));
  const total = (items: FxEvent[], type: FxEvent['type']) =>
    round2(
      items
        .filter((event) => event.type === type)
        .reduce((sum, event) => sum + event.equivalent, 0),
    );
  const purchases = total(yearEvents, 'purchase');
  const coupons = total(yearEvents, 'coupon');
  const redemptions = total(yearEvents, 'redemption');
  const months: FxMonth[] = [];
  for (const month of monthsBetween(`${year}-01-01`, throughDate)) {
    const monthEvents = yearEvents.filter((event) => event.date.startsWith(month));
    const date = monthEnd(month, throughDate);
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
    months.push({
      month,
      purchases: total(monthEvents, 'purchase'),
      coupons: total(monthEvents, 'coupon'),
      redemptions: total(monthEvents, 'redemption'),
      investedFx,
      currentFx: round2(receivedFx + remainingUah / rate),
    });
  }
  const bonds = wallet.positions
    .filter(({ position }) => yearEvents.some((event) => event.isin === position.isin))
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
        events: yearEvents.filter((event) => event.isin === position.isin),
        invested,
        received,
        result: completed ? round2(received - invested) : null,
      };
    });
  const completed = bonds.filter((bond) => bond.result !== null);

  return {
    year,
    throughDate,
    bonds,
    months,
    purchases,
    coupons,
    redemptions,
    yearBalance: round2(coupons + redemptions - purchases),
    completedResult: round2(completed.reduce((sum, bond) => sum + (bond.result ?? 0), 0)),
    completedCount: completed.length,
    openCount: bonds.length - completed.length,
  };
}
