import {
  type Bond,
  type Currency,
  type PositionPayment,
  type Purchase,
  type PurchaseEvent,
  groupPositions,
  purchaseCurrency,
  purchaseEvents,
} from './portfolio';
import { type WalletPosition, walletPosition } from './position';

/**
 * The Positions of a set of Purchases joined with the NBU data, as of a day. Every field follows
 * from the purchases, so a Wallet is only ever built whole, never edited field by field.
 */
export type Wallet = {
  purchases: Purchase[];
  /** The NBU data by ISIN */
  byIsin: Map<string, Bond>;
  today: string;
  positions: WalletPosition[];
  /** Every Position's payments, by date */
  payments: PositionPayment[];
  /** Every purchase as an event, by date */
  purchaseEvents: PurchaseEvent[];
};

/** A currency and the bonds to keep; null and an empty list keep every one. */
export type WalletScope = {
  currency: Currency | null;
  isins: string[];
};

/** The Wallet of the purchases as of today. Payments of bonds missing from the NBU data are left out. */
export function buildWallet(
  purchases: Purchase[],
  byIsin: Map<string, Bond>,
  today: string,
): Wallet {
  const positions = groupPositions(purchases).map((position) =>
    walletPosition(position, byIsin.get(position.isin), today),
  );
  return {
    purchases,
    byIsin,
    today,
    positions,
    payments: positions
      .flatMap(({ payments }) => payments)
      .sort((first, second) => first.date.localeCompare(second.date)),
    purchaseEvents: purchaseEvents(purchases, byIsin),
  };
}

/** The Wallet of only the purchases in the currency and of the bonds the scope keeps. */
export function narrowWallet(wallet: Wallet, { currency, isins }: WalletScope): Wallet {
  const { byIsin, today } = wallet;
  const kept = wallet.purchases.filter(
    (purchase) =>
      (currency === null || purchaseCurrency(purchase, byIsin.get(purchase.isin)) === currency) &&
      (isins.length === 0 || isins.includes(purchase.isin)),
  );
  return buildWallet(kept, byIsin, today);
}
