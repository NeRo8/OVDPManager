import { todayISO } from '@/shared/lib';
import { useBonds } from '../api/useBonds.hook';
import { useActivePlan } from './activePlan.store';
import { usePurchases } from './purchases.store';
import {
  type Bond,
  type Currency,
  type Position,
  type PositionPayment,
  groupPositions,
  nextPayment,
  positionCurrency,
  positionPayments,
  purchaseEvents,
} from './portfolio';

export type WalletPosition = {
  position: Position;
  /** Missing when the NBU data has no such bond */
  bond?: Bond;
  currency: Currency | null;
  payments: PositionPayment[];
  nextPayment?: PositionPayment;
};

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
  const { bonds, byIsin, error, refresh } = useBonds();
  const today = todayISO();

  const positions = groupPositions(purchases).map((position): WalletPosition => {
    const bond = byIsin.get(position.isin);
    const payments = bond ? positionPayments(position.purchases, bond, today) : [];
    return {
      position,
      bond,
      currency: positionCurrency(position, bond),
      payments,
      nextPayment: nextPayment(payments),
    };
  });
  const payments = positions
    .flatMap(({ payments }) => payments)
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    plan,
    numberOfPurchases: purchases.length,
    bonds,
    byIsin,
    error,
    refresh,
    today,
    positions,
    payments,
    purchaseEvents: purchaseEvents(purchases, byIsin),
  };
}

export type Wallet = ReturnType<typeof useWallet>;
