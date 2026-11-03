import { useQueryClient } from '@tanstack/react-query';

import { keyRateQuery, keyRateYear } from '@/api/nbu/keyRateQuery';
import { buildWallet } from '@/lib/portfolio/wallet';
import { useToday, showToast } from '@/stores/appSettings';
import { useActiveOperations } from '@/stores/plans';

import { useBonds } from './useBonds.hook';

/**
 * The Wallet of the active plan, built from the stores and the NBU data: what every screen built
 * on positions and payments starts from. Next to the Wallet it gives the plan, the whole NBU
 * catalog and a way to refresh it.
 */
export function useWallet() {
  const { plan, operations } = useActiveOperations();
  const { bonds, byIsin, refresh: refreshBonds } = useBonds();
  const today = useToday();
  const queryClient = useQueryClient();
  const refresh = async () => {
    const [, rate] = await Promise.allSettled([
      refreshBonds(),
      queryClient.fetchQuery({ ...keyRateQuery(keyRateYear(today, today), today), staleTime: 0 }),
    ]);
    if (rate.status === 'rejected') {
      showToast({
        tone: 'error',
        title: 'Не вдалося оновити облікову ставку',
        message: 'Спробуйте ще раз.',
      });
    }
  };
  return { ...buildWallet(operations, byIsin, today), plan, bonds, refresh };
}
