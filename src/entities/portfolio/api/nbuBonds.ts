import { z } from 'zod';

import { type Bond, type BondPayment, CURRENCIES, type PaymentType } from '../model/ovdp';
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
 * One security of `/depo_securities?json`. The descriptive fields are optional: they are not
 * needed to build a Bond, so a change in them should not drop the bond.
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
  /** DCP — domestic bond (ОВДП), OZDP — bond issued for the external debt restructuring (ОЗДП) */
  cptype: z.string().optional(),
  /** Days between coupons: 182 (semiannual), 364 or 365 (annual) */
  pay_period: z.number().optional(),
  /** Issuer's ЄДРПОУ code; 00013480 is the Ministry of Finance */
  emit_okpo: z.string().optional(),
  emit_name: z.string().optional(),
  /** Security type code of the НКЦПФР classifier */
  cptype_nkcpfr: z.string().optional(),
  /** ISO 10962 CFI code */
  cpcode_cfi: z.string().optional(),
  /** Bonds in circulation; null for OZDP */
  total_bonds: z.number().nullable().optional(),
});

type NbuPayment = z.infer<typeof NbuPaymentSchema>;
type NbuSecurity = z.infer<typeof NbuSecuritySchema>;

const PAYMENT_TYPES = {
  '1': 'coupon',
  '2': 'redemption',
} as const satisfies Record<NbuPayment['pay_type'], PaymentType>;

function parseSecurity(raw: NbuSecurity): Bond {
  const payments = raw.payments
    .map((p): BondPayment => ({
      date: p.pay_date,
      type: PAYMENT_TYPES[p.pay_type],
      amount: p.pay_val,
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type));

  return {
    isin: raw.cpcode,
    nominal: raw.nominal,
    rate: raw.auk_proc,
    currency: raw.val_code,
    issueDate: raw.razm_date,
    maturityDate: raw.pgs_date,
    description: raw.cpdescr,
    payments,
  };
}

/**
 * Full bond payment schedules from the NBU depository. A security that does not match the schema
 * is skipped, including one with an unknown payment type: better missing than miscounted.
 */
export async function fetchBonds(): Promise<Bond[]> {
  // Unknown until the schemas below have checked it: axios does not validate the response.
  const { data } = await nbuClient.get<unknown>('/depo_securities?json');
  const list = z.array(z.unknown()).safeParse(data);
  if (!list.success) {
    throw new Error('Неочікуваний формат відповіді НБУ');
  }
  const bonds = list.data.flatMap((item) => {
    const result = NbuSecuritySchema.safeParse(item);
    return result.success ? [parseSecurity(result.data)] : [];
  });
  if (__DEV__ && bonds.length < list.data.length) {
    console.warn(`Skipped ${list.data.length - bonds.length} NBU securities that fail the schema`);
  }
  return bonds;
}
