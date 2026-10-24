import {
  type Bond,
  type BondPayment,
  CURRENCIES,
  type Currency,
  type PaymentType,
} from '../model/portfolio';
import { nbuClient } from '@/shared/api';

/** One row of a bond's payment schedule, as `/depo_securities?json` returns it. */
type NbuPayment = {
  pay_date: string;
  /** '1' coupon, '2' redemption of the nominal (comes on the same date as the last coupon) */
  pay_type: '1' | '2';
  /** Amount per one bond, in the bond currency */
  pay_val: number;
  // `array` is always the string 'true' and carries no meaning, so it is not read.
};

/** Fields used to build a Bond from `/depo_securities?json`; other response fields are not read. */
type NbuSecurity = {
  /** ISIN: UA4000… for domestic bonds, XS… for OZDP */
  cpcode: string;
  /** Face value of one bond: 1000 for domestic bonds, 1 for OZDP */
  nominal: number;
  /** Annual coupon rate set at the auction, % */
  auk_proc: number;
  /** Maturity date (погашення) */
  pgs_date: string;
  /** Placement date (розміщення) */
  razm_date: string;
  /** Human-readable kind, e.g. «Довгострокові», «Середньострокові», «OЗДП-довгострокова» */
  cpdescr: string;
  val_code: string;
  /** Ordered by date; may still lack the far rows (e.g. a recently placed OZDP has no redemption yet) */
  payments: NbuPayment[];
};

/** The app formats and totals only these currencies. */
function isSupportedCurrency(code: string): code is Currency {
  return (CURRENCIES as readonly string[]).includes(code);
}

const PAYMENT_TYPES = {
  '1': 'coupon',
  '2': 'redemption',
} as const satisfies Record<NbuPayment['pay_type'], PaymentType>;

function mapNbuSecurityToBond(security: NbuSecurity, currency: Currency): Bond {
  const payments = security.payments
    .map((payment): BondPayment => ({
      date: payment.pay_date,
      type: PAYMENT_TYPES[payment.pay_type],
      amount: payment.pay_val,
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type));

  return {
    isin: security.cpcode.trim().toUpperCase(),
    nominal: security.nominal,
    rate: security.auk_proc,
    currency,
    issueDate: security.razm_date,
    maturityDate: security.pgs_date,
    description: security.cpdescr,
    payments,
  };
}

/** Full bond payment schedules from the NBU depository; a bond in another currency is skipped. */
export async function fetchBonds(signal?: AbortSignal): Promise<Bond[]> {
  const { data } = await nbuClient.get<NbuSecurity[]>('/depo_securities?json', { signal });
  return data.flatMap((security) =>
    isSupportedCurrency(security.val_code)
      ? [mapNbuSecurityToBond(security, security.val_code)]
      : [],
  );
}
