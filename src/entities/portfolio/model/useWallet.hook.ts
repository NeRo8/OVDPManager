import { useQueryClient } from '@tanstack/react-query';

import { useToday } from '@/shared/config';
import { showToast } from '@/shared/lib';

import { keyRateQuery, keyRateYear } from '../api/keyRateQuery';
import { useBonds } from '../api/useBonds.hook';

import { useActivePlan } from './activePlan';
import { usePurchases } from './purchases';
import { buildWallet } from './wallet';

/** Purchases in the wallet of the active plan. */
export function useActivePurchases() {
  const plan = useActivePlan();
  const purchases = usePurchases().filter((purchase) => purchase.planId === plan?.id);
  return { plan, purchases };
}

/**
 * The Wallet of the active plan, built from the stores and the NBU data: what every screen built
 * on positions and payments starts from. Next to the Wallet it gives the plan, the whole NBU
 * catalog and a way to refresh it.
 */
export function useWallet() {
  const { plan, purchases } = useActivePurchases();
  const { bonds, byIsin, refresh: refreshBonds } = useBonds();
  const today = useToday();
  const queryClient = useQueryClient();
  const refresh = async () => {
    const [, rate] = await Promise.allSettled([
      refreshBonds(),
      queryClient.fetchQuery({ ...keyRateQuery(keyRateYear(today)), staleTime: 0 }),
    ]);
    if (rate.status === 'rejected') {
      showToast({
        tone: 'error',
        title: 'Не вдалося оновити облікову ставку',
        message: 'Спробуйте ще раз.',
      });
    }
  };
  return { ...buildWallet(purchases, byIsin, today), plan, bonds, refresh };
}

/** The active plan's Wallet with the plan and the NBU catalog it came from. */
export type ActiveWallet = ReturnType<typeof useWallet>;
