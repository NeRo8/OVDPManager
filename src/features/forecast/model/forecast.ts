/**
 * Income forecast for a savings plan: monthly top-ups and reinvested payments go into short-term
 * bonds. Future auctions are unknown, so a planned purchase is a virtual bond with the expected
 * yield: it pays interest like OVDP coupons, every half year, and the nominal at maturity.
 */

import { daysBetween } from '@/shared/lib';
import type { PaymentType, PositionPayment } from '@/entities/portfolio';
import { round2 } from '@/shared/lib/number';

/** The forecast is in hryvnias; bonds in other currencies stay out of it. */
export const FORECAST_CURRENCY = 'UAH';

export const TERM_OPTIONS = [3, 6, 12] as const;
/** OVDP pay coupons every 182 days. */
const COUPON_PERIOD_MONTHS = 6;

export type ForecastPlan = {
  /** Monthly top-up in dollars, spent in hryvnias at the dollar rate */
  monthlyUsd: number;
  /** Hryvnias per dollar; null — the current NBU rate */
  usdRate: number | null;
  /** Top-ups go on through December of this year */
  contributeUntilYear: number;
  /** Coupons and interest received through December of this year are reinvested */
  reinvestUntilYear: number;
  /** Reinvest the nominal of redeemed wallet bonds as well */
  reinvestNominal: boolean;
  /** Expected yield of short-term bonds, % a year */
  yieldRate: number;
  /** Months from purchase to maturity */
  termMonths: (typeof TERM_OPTIONS)[number];
};

export function defaultPlan(today: string): ForecastPlan {
  const year = Number(today.slice(0, 4));
  return {
    monthlyUsd: 500,
    usdRate: null,
    contributeUntilYear: year + 1,
    reinvestUntilYear: year,
    reinvestNominal: true,
    yieldRate: 16,
    termMonths: 6,
  };
}

/** One monthly purchase of short-term bonds. */
export type PlannedPurchase = {
  /** First day of the month, YYYY-MM-DD */
  date: string;
  maturityDate: string;
  /** Hryvnias from the monthly top-up */
  contribution: number;
  /** Hryvnias from payments received the month before */
  reinvested: number;
  amount: number;
  /** Interest paid until maturity */
  income: number;
};

export type ForecastPayment = {
  date: string;
  type: PaymentType;
  total: number;
  /** From the bonds in the wallet, or from a planned purchase */
  source: 'wallet' | 'plan';
  isPaid: boolean;
  /** Goes into next month's purchase instead of being paid out */
  isReinvested: boolean;
};

export type Forecast = {
  payments: ForecastPayment[];
  purchases: PlannedPurchase[];
  /** Monthly top-up in hryvnias; 0 without a dollar rate */
  contribution: number;
};

/** "YYYY-MM" shifted by a number of months. */
function shiftMonth(key: string, months: number): string {
  const [y, m] = key.split('-').map(Number);
  const index = y * 12 + (m - 1) + months;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

/**
 * Wallet payments plus the plan's purchases and payouts. Purchases are made on the first day of
 * each month, starting next month: the top-up plus everything reinvestable received the month
 * before. Payments already received are history — they were reinvested by hand, if at all.
 *
 * The plan's own bonds are where the savings are parked, so their nominal rolls over until the
 * plan ends (the later of the two years) and is paid out after that.
 */
export function buildForecast(
  walletPayments: PositionPayment[],
  plan: ForecastPlan,
  usdRate: number | null,
  today: string,
): Forecast {
  const planEndYear = Math.max(plan.contributeUntilYear, plan.reinvestUntilYear);
  const isReinvestable = (date: string, type: PaymentType, source: ForecastPayment['source']) => {
    const year = Number(date.slice(0, 4));
    if (type === 'coupon') return year <= plan.reinvestUntilYear;
    return source === 'plan'
      ? year <= planEndYear
      : year <= plan.reinvestUntilYear && plan.reinvestNominal;
  };

  const payments: ForecastPayment[] = walletPayments
    .filter((p) => p.currency === FORECAST_CURRENCY)
    .map((p) => ({
      date: p.date,
      type: p.type,
      total: p.total,
      source: 'wallet',
      isPaid: p.isPaid,
      isReinvested: !p.isPaid && isReinvestable(p.date, p.type, 'wallet'),
    }));

  // Reinvestable cash by the month it arrives, "YYYY-MM".
  const inflows = new Map<string, number>();
  const collect = (p: ForecastPayment) => {
    if (!p.isReinvested) return;
    const key = p.date.slice(0, 7);
    inflows.set(key, (inflows.get(key) ?? 0) + p.total);
  };
  payments.forEach(collect);

  const contribution = usdRate ? round2(plan.monthlyUsd * usdRate) : 0;
  const purchases: PlannedPurchase[] = [];
  // December's payments are reinvested in January.
  const lastMonth = `${planEndYear + 1}-01`;

  for (
    let month = shiftMonth(today.slice(0, 7), 1);
    month <= lastMonth;
    month = shiftMonth(month, 1)
  ) {
    const reinvested = round2(inflows.get(shiftMonth(month, -1)) ?? 0);
    const topUp = Number(month.slice(0, 4)) <= plan.contributeUntilYear ? contribution : 0;
    const amount = round2(reinvested + topUp);
    if (amount <= 0) continue;

    const date = `${month}-01`;
    const maturityDate = `${shiftMonth(month, plan.termMonths)}-01`;
    const payouts: { date: string; type: PaymentType; total: number }[] = [];
    // A short bond pays its single coupon at maturity.
    const period = Math.min(plan.termMonths, COUPON_PERIOD_MONTHS);
    let couponStart = date;
    for (let offset = period; offset <= plan.termMonths; offset += period) {
      const couponDate = `${shiftMonth(month, offset)}-01`;
      const interest =
        ((amount * plan.yieldRate) / 100) * (daysBetween(couponStart, couponDate) / 365);
      payouts.push({ date: couponDate, type: 'coupon', total: round2(interest) });
      couponStart = couponDate;
    }
    payouts.push({ date: maturityDate, type: 'redemption', total: amount });

    const income = round2(
      payouts.filter((p) => p.type === 'coupon').reduce((sum, p) => sum + p.total, 0),
    );
    purchases.push({ date, maturityDate, contribution: topUp, reinvested, amount, income });

    for (const payout of payouts) {
      const payment: ForecastPayment = {
        ...payout,
        source: 'plan',
        isPaid: false,
        isReinvested: isReinvestable(payout.date, payout.type, 'plan'),
      };
      payments.push(payment);
      collect(payment);
    }
  }

  payments.sort((a, b) => a.date.localeCompare(b.date));
  return { payments, purchases, contribution };
}

export type ForecastYear = {
  /** Twelve monthly coupon totals from the wallet bonds, January first */
  walletIncome: number[];
  /** Twelve monthly interest totals from the planned purchases */
  planIncome: number[];
  /** Income already received this year */
  paidIncome: number;
  contributions: number;
  reinvested: number;
  /** Payments that are not reinvested: coupons and interest, and returned nominal */
  cashOut: { income: number; nominal: number };
  /** Nominal still invested at the end of the year */
  nominalAtYearEnd: number;
  purchases: PlannedPurchase[];
};

const sum = (values: number[]) => round2(values.reduce((total, value) => total + value, 0));

export function forecastYear(forecast: Forecast, year: number): ForecastYear {
  const prefix = `${year}-`;
  const yearEnd = `${year}-12-31`;
  const inYear = forecast.payments.filter((p) => p.date.startsWith(prefix));
  const purchases = forecast.purchases.filter((p) => p.date.startsWith(prefix));
  const monthly = (source: ForecastPayment['source']) =>
    Array.from({ length: 12 }, (_, month) =>
      sum(
        inYear
          .filter(
            (p) =>
              p.source === source &&
              p.type === 'coupon' &&
              Number(p.date.slice(5, 7)) - 1 === month,
          )
          .map((p) => p.total),
      ),
    );
  const cashOut = (type: PaymentType) =>
    sum(inYear.filter((p) => p.type === type && !p.isPaid && !p.isReinvested).map((p) => p.total));

  return {
    walletIncome: monthly('wallet'),
    planIncome: monthly('plan'),
    paidIncome: sum(inYear.filter((p) => p.type === 'coupon' && p.isPaid).map((p) => p.total)),
    contributions: sum(purchases.map((p) => p.contribution)),
    reinvested: sum(purchases.map((p) => p.reinvested)),
    cashOut: { income: cashOut('coupon'), nominal: cashOut('redemption') },
    nominalAtYearEnd: sum([
      // Wallet bonds still to be redeemed after the year…
      ...forecast.payments
        .filter((p) => p.source === 'wallet' && p.type === 'redemption' && p.date > yearEnd)
        .map((p) => p.total),
      // …and planned purchases made by then that mature later.
      ...forecast.purchases
        .filter((p) => p.date <= yearEnd && p.maturityDate > yearEnd)
        .map((p) => p.amount),
    ]),
    purchases,
  };
}
