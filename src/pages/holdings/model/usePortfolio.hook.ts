import { useWallet } from '@/entities/portfolio';

export function usePortfolio() {
  const wallet = useWallet();
  const upcoming = wallet.payments.filter((payment) => !payment.isPaid);
  const nextDate = upcoming[0]?.date;
  const nextGroup = nextDate ? upcoming.filter((payment) => payment.date === nextDate) : [];

  return { ...wallet, nextDate, nextGroup };
}
