import type { Bond, BondPayment } from '../model/ovdp';
import { nbuClient } from '@/shared/api';

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
  val_code: string;
  payments?: NbuPayment[];
};

function parseSecurity(raw: NbuSecurity): Bond {
  const payments = (raw.payments ?? [])
    .map((p): BondPayment => ({
      date: p.pay_date,
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
    description: raw.cpdescr,
    payments,
  };
}

/** Full bond payment schedules from the NBU depository. */
export async function fetchBonds(): Promise<Bond[]> {
  const { data } = await nbuClient.get<unknown>('/depo_securities?json');
  if (!Array.isArray(data)) {
    throw new Error('Неочікуваний формат відповіді НБУ');
  }
  return (data as NbuSecurity[]).filter((security) => security?.cpcode).map(parseSecurity);
}
