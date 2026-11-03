import {
  type Bond,
  CURRENCIES,
  type Currency,
  type PositionPayment,
  type Purchase,
  type PurchaseEvent,
  groupPositions,
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

/** What a Wallet can be narrowed to. */
export type WalletScopeOptions = {
  /** Positions in the wallet, by ISIN, including those without NBU data. */
  isins: string[];
  /** In `CURRENCIES` order */
  currencies: Currency[];
  /** Each of `isins`' currency */
  currencyOf: Record<string, Currency>;
};

export function walletScopeOptions(wallet: Wallet): WalletScopeOptions {
  const positions = wallet.positions;
  return {
    isins: positions.map(({ position }) => position.isin).sort(),
    currencyOf: Object.fromEntries(
      positions.map(({ position, currency }) => [position.isin, currency]),
    ),
    currencies: CURRENCIES.filter((currency) =>
      [...wallet.payments, ...wallet.purchaseEvents].some((event) => event.currency === currency),
    ),
  };
}

/** The bonds to pick from in a currency; every bond without one. */
export function isinsIn(options: WalletScopeOptions, currency: Currency | null): string[] {
  return currency === null
    ? options.isins
    : options.isins.filter((isin) => options.currencyOf[isin] === currency);
}
