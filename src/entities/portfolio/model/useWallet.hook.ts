import { todayISO } from '@/shared/lib';
import { useBonds } from '../api/bonds.store';
import { useHoldings } from './holdings.store';
import {
  type Bond,
  type Position,
  type PositionPayment,
  groupPositions,
  nextPayment,
  positionPayments,
  purchaseEvents,
} from './ovdp';

export type WalletPosition = {
  position: Position;
  /** Missing when the NBU data has no such bond */
  bond?: Bond;
  payments: PositionPayment[];
  next?: PositionPayment;
};

/**
 * The wallet joined with the NBU data: what every screen built on positions and payments starts
 * from. Payments of positions missing from the NBU data are left out.
 */
export function useWallet() {
  const holdings = useHoldings();
  const { bonds, byIsin, isFetching, error, refresh } = useBonds();
  const today = todayISO();

  const positions = groupPositions(holdings).map((position): WalletPosition => {
    const bond = byIsin.get(position.isin);
    const payments = bond ? positionPayments(position.lots, bond, today) : [];
    return { position, bond, payments, next: nextPayment(payments) };
  });
  const payments = positions
    .flatMap(({ payments }) => payments)
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    holdingsCount: holdings.length,
    bonds,
    byIsin,
    isFetching,
    error,
    refresh,
    today,
    positions,
    payments,
    purchases: purchaseEvents(holdings, byIsin),
  };
}

export type Wallet = ReturnType<typeof useWallet>;
