import { operationBonds } from './operations';
import {
  type Bond,
  CURRENCIES,
  type Currency,
  type PositionPayment,
  type Operation,
  type OperationEvent,
  groupPositions,
  operationEvents,
} from './portfolio';
import { type WalletPosition, walletPosition } from './position';

/**
 * The Positions of a set of Purchases joined with the NBU data, as of a day. Every field follows
 * from the operations, so a Wallet is only ever built whole, never edited field by field.
 */
export type Wallet = {
  operations: Operation[];
  /** The NBU data by ISIN */
  byIsin: Map<string, Bond>;
  today: string;
  positions: WalletPosition[];
  /** Every Position's payments, by date */
  payments: PositionPayment[];
  /** Every purchase as an event, by date */
  operationEvents: OperationEvent[];
};

/** The Wallet of the operations as of today. Payments of bonds missing from the NBU data are left out. */
export function buildWallet(
  operations: Operation[],
  byIsin: Map<string, Bond>,
  today: string,
): Wallet {
  byIsin = operationBonds(operations, byIsin, today);
  const positions = groupPositions(operations).map((position) =>
    walletPosition(position, byIsin.get(position.isin), today),
  );
  return {
    operations,
    byIsin,
    today,
    positions,
    payments: positions
      .flatMap(({ payments }) => payments)
      .sort((first, second) => first.date.localeCompare(second.date)),
    operationEvents: operationEvents(operations, byIsin),
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
      [...wallet.payments, ...wallet.operationEvents].some((event) => event.currency === currency),
    ),
  };
}

/** The bonds to pick from in a currency; every bond without one. */
export function isinsIn(options: WalletScopeOptions, currency: Currency | null): string[] {
  return currency === null
    ? options.isins
    : options.isins.filter((isin) => options.currencyOf[isin] === currency);
}
