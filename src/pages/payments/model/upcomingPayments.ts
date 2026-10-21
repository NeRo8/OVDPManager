import { filterPayments } from '@/features/payment-filters';
import type { FilteredWallet } from './useFilteredWallet.hook';
import { groupPaymentsByMonth } from './paymentSections';

/** Payments still ahead that pass the filters, and how many there are without them. */
export function upcomingPayments({ wallet, filters }: FilteredWallet) {
  const all = wallet.payments.filter((payment) => !payment.isPaid);
  const upcoming = filterPayments(all, filters, wallet.today);
  return { upcoming, allCount: all.length, sections: groupPaymentsByMonth(upcoming) };
}
