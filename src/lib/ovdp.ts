/**
 * Government bonds (ОВДП) data from the National Bank of Ukraine depository.
 * Source: https://bank.gov.ua/depo_securities?json — every bond with its full payment schedule.
 */

const NBU_SECURITIES_URL = 'https://bank.gov.ua/depo_securities?json';

export type PaymentType = 'coupon' | 'redemption';

export type BondPayment = {
  /** ISO date, YYYY-MM-DD */
  date: string;
  type: PaymentType;
  /** Amount paid per one bond, in the bond currency */
  amount: number;
};

export type Bond = {
  isin: string;
  nominal: number;
  /** Annual coupon rate, % */
  rate: number;
  currency: string;
  issueDate: string;
  maturityDate: string;
  /** Days between coupon payments */
  periodDays: number;
  description: string;
  payments: BondPayment[];
};

/** One purchase (lot). Several purchases of the same ISIN form a position. */
export type Holding = {
  id: string;
  isin: string;
  purchaseDate: string;
  /** Total amount paid for the bonds, in the bond currency */
  amount: number;
  quantity: number;
};

/** All purchases of one ISIN. */
export type Position = {
  isin: string;
  /** Sorted by purchase date */
  lots: Holding[];
  quantity: number;
  amount: number;
};

export type PositionPayment = BondPayment & {
  isin: string;
  currency: string;
  /** Bonds held on the payment date */
  quantity: number;
  /** Per-bond amount × quantity */
  total: number;
  isPaid: boolean;
};

type NbuPayment = {
  pay_date: string;
  pay_type: string;
  pay_val: number;
};

type NbuSecurity = {
  cpcode: string;
  nominal: number;
  auk_proc: number;
  pgs_date: string;
  razm_date: string;
  cpdescr: string;
  pay_period: number;
  val_code: string;
  payments?: NbuPayment[];
};

function parseSecurity(raw: NbuSecurity): Bond {
  const payments = (raw.payments ?? [])
    .map((p): BondPayment => ({
      date: p.pay_date,
      // pay_type "1" is a coupon, "2" is the redemption of the nominal
      type: p.pay_type === '2' ? 'redemption' : 'coupon',
      amount: p.pay_val,
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type));

  return {
    isin: raw.cpcode.trim().toUpperCase(),
    nominal: raw.nominal,
    rate: raw.auk_proc,
    currency: raw.val_code,
    issueDate: raw.razm_date,
    maturityDate: raw.pgs_date,
    periodDays: raw.pay_period,
    description: raw.cpdescr,
    payments,
  };
}

export async function fetchBonds(): Promise<Bond[]> {
  const response = await fetch(NBU_SECURITIES_URL);
  if (!response.ok) {
    throw new Error(`НБУ відповів з помилкою ${response.status}`);
  }
  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Неочікуваний формат відповіді НБУ');
  }
  return (data as NbuSecurity[]).filter((s) => s?.cpcode).map(parseSecurity);
}

/** Bonds whose ISIN contains the query; active bonds first, then by maturity. */
export function searchBonds(bonds: Bond[], query: string, today: string, limit = 20): Bond[] {
  const q = query.replace(/\s+/g, '').toUpperCase();
  if (!q) return [];
  return bonds
    .filter((b) => b.isin.includes(q))
    .sort((a, b) => {
      const aActive = a.maturityDate >= today;
      const bActive = b.maturityDate >= today;
      if (aActive !== bActive) return aActive ? -1 : 1;
      return a.maturityDate.localeCompare(b.maturityDate);
    })
    .slice(0, limit);
}

/** Groups purchases by ISIN, keeping the order in which each ISIN was first added. */
export function groupPositions(holdings: Holding[]): Position[] {
  const byIsin = new Map<string, Holding[]>();
  for (const holding of holdings) {
    byIsin.set(holding.isin, [...(byIsin.get(holding.isin) ?? []), holding]);
  }
  return [...byIsin].map(([isin, lots]) => ({
    isin,
    lots: lots.sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate)),
    quantity: lots.reduce((sum, lot) => sum + lot.quantity, 0),
    amount: round2(lots.reduce((sum, lot) => sum + lot.amount, 0)),
  }));
}

/**
 * Payments the holder is entitled to. Each payment counts only the bonds bought before its date:
 * a payment on the purchase day itself goes to the previous owner (the register closes before it),
 * so a top-up starts earning from the next payment.
 */
export function positionPayments(lots: Holding[], bond: Bond, today: string): PositionPayment[] {
  return bond.payments.flatMap((p) => {
    const quantity = lots
      .filter((lot) => lot.purchaseDate < p.date)
      .reduce((sum, lot) => sum + lot.quantity, 0);
    if (quantity === 0) return [];
    return [
      {
        ...p,
        isin: bond.isin,
        currency: bond.currency,
        quantity,
        total: round2(p.amount * quantity),
        isPaid: p.date < today,
      },
    ];
  });
}

/** Every payment across the wallet, by date. Positions missing from the NBU data are skipped. */
export function portfolioPayments(
  holdings: Holding[],
  byIsin: Map<string, Bond>,
  today: string,
): PositionPayment[] {
  return groupPositions(holdings)
    .flatMap((position) => {
      const bond = byIsin.get(position.isin);
      return bond ? positionPayments(position.lots, bond, today) : [];
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function nextPayment(payments: PositionPayment[]): PositionPayment | undefined {
  return payments.find((p) => !p.isPaid);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
