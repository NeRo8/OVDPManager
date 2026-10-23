import { z } from 'zod';

import { type Bond, type BondPayment, CURRENCIES, type PaymentType } from '../model/portfolio';
import { nbuClient } from '@/shared/api';

/** One row of a bond's payment schedule, as `/depo_securities?json` returns it. */
const NbuPaymentSchema = z.object({
  pay_date: z.iso.date(),
  /** '1' coupon, '2' redemption of the nominal (comes on the same date as the last coupon) */
  pay_type: z.enum(['1', '2']),
  /** Amount per one bond, in the bond currency */
  pay_val: z.number(),
  // `array` is always the string 'true' and carries no meaning, so it is dropped.
});

/**
 * Fields used to build a Bond from `/depo_securities?json`. Other response fields are ignored,
 * so a change to an unused field cannot drop the bond.
 */
const NbuSecuritySchema = z.object({
  /** ISIN: UA4000… for domestic bonds, XS… for OZDP */
  cpcode: z.string().trim().toUpperCase().min(1),
  /** Face value of one bond: 1000 for domestic bonds, 1 for OZDP */
  nominal: z.number(),
  /** Annual coupon rate set at the auction, % */
  auk_proc: z.number(),
  /** Maturity date (погашення) */
  pgs_date: z.iso.date(),
  /** Placement date (розміщення) */
  razm_date: z.iso.date(),
  /** Human-readable kind, e.g. «Довгострокові», «Середньострокові», «OЗДП-довгострокова» */
  cpdescr: z.string(),
  /** A bond in another currency is skipped: the app formats and totals only these */
  val_code: z.enum(CURRENCIES),
  /** Ordered by date; may still lack the far rows (e.g. a recently placed OZDP has no redemption yet) */
  payments: z.array(NbuPaymentSchema),
});

type NbuPayment = z.infer<typeof NbuPaymentSchema>;
type NbuSecurity = z.infer<typeof NbuSecuritySchema>;

const PAYMENT_TYPES = {
  '1': 'coupon',
  '2': 'redemption',
} as const satisfies Record<NbuPayment['pay_type'], PaymentType>;

function mapNbuSecurityToBond(security: NbuSecurity): Bond {
  const payments = security.payments
    .map((payment): BondPayment => ({
      date: payment.pay_date,
      type: PAYMENT_TYPES[payment.pay_type],
      amount: payment.pay_val,
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type));

  return {
    isin: security.cpcode,
    nominal: security.nominal,
    rate: security.auk_proc,
    currency: security.val_code,
    issueDate: security.razm_date,
    maturityDate: security.pgs_date,
    description: security.cpdescr,
    payments,
  };
}

/**
 * Full bond payment schedules from the NBU depository. A security that does not match the schema
 * is skipped, including one with an unknown payment type: better missing than miscounted.
 */
export async function fetchBonds(signal?: AbortSignal): Promise<Bond[]> {
  // Unknown until the schemas below have checked it: axios does not validate the response.
  const { data } = await nbuClient.get<unknown>('/depo_securities?json', { signal });
  const list = z.array(z.unknown()).safeParse(data);
  if (!list.success) {
    throw new Error('Неочікуваний формат відповіді НБУ');
  }
  const bonds = list.data.flatMap((item) => {
    const result = NbuSecuritySchema.safeParse(item);
    return result.success ? [mapNbuSecurityToBond(result.data)] : [];
  });
  return bonds;
}
