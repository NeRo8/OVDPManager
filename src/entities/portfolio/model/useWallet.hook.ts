import { todayISO } from '@/shared/lib';
import { useBonds } from '../api/useBonds.hook';
import { useActivePlan } from './activePlan';
import { usePurchases } from './purchases';
import { groupPositions, purchaseEvents } from './portfolio';
import { walletPosition } from './position';

/** Purchases in the wallet of the active plan. */
export function useActivePurchases() {
  const plan = useActivePlan();
  const purchases = usePurchases().filter((purchase) => purchase.planId === plan?.id);
  return { plan, purchases };
}

/**
 * The wallet of the active plan joined with the NBU data: what every screen built on positions and payments starts
 * from. Payments of positions missing from the NBU data are left out.
 */
export function useWallet() {
  const { plan, purchases } = useActivePurchases();
  const { bonds, byIsin, refresh } = useBonds();
  const today = todayISO();

  const positions = groupPositions(purchases).map((position) =>
    walletPosition(position, byIsin.get(position.isin), today),
  );
  const payments = positions
    .flatMap(({ payments }) => payments)
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    plan,
    purchases,
    bonds,
    byIsin,
    refresh,
    today,
    positions,
    payments,
    purchaseEvents: purchaseEvents(purchases, byIsin),
  };
}

export type Wallet = ReturnType<typeof useWallet>;
