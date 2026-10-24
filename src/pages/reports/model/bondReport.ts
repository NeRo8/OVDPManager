import {
  type PurchaseResults,
  type Wallet,
  type WalletPosition,
  purchaseResults,
} from '@/entities/portfolio';
import { filterWallet } from '@/features/report-filters';
import { positionYield } from './periodReport';
import { type BondState, bondState } from './portfolioReport';
import { type CurrencyYears, yearOverYearReport } from './yearOverYearReport';
import { KEY_RATE_CURRENCY, type KeyRateOn, keyRateAt } from './yieldReport';

/** One bond of the wallet, from its first purchase to its last payment. */
export type BondReport = {
  item: WalletPosition;
  state: BondState;
  /** What it costs and earns; missing without the NBU data */
  results?: PurchaseResults;
  /** «Річна дохідність»; null until NBU publishes the redemption */
  annualYield: number | null;
  /** The key rate on its purchase dates, weighted by amount; null for another currency or until loaded */
  keyRateAtPurchase: number | null;
  /** Its money by year, empty years included; missing without purchases or payments */
  money?: CurrencyYears;
};

/** The wallet's bonds for the report to pick from: the nearest to maturity first, unknown last. */
export function bondChoicesByMaturity(wallet: Wallet): WalletPosition[] {
  return [...wallet.positions].sort((first, second) =>
    (first.bond?.maturityDate ?? '9999').localeCompare(second.bond?.maturityDate ?? '9999'),
  );
}

/** Everything about one bond of the wallet: what it cost, pays and earns, by year too. */
export function bondReport(wallet: Wallet, item: WalletPosition, keyRateOn: KeyRateOn): BondReport {
  const { byIsin, today } = wallet;
  const { position, currency } = item;
  const alone = filterWallet(wallet, { currency: null, isins: [position.isin] });

  return {
    item,
    state: bondState(item, today),
    results: purchaseResults(position.purchases, byIsin, today).at(0),
    annualYield: positionYield(item, today),
    keyRateAtPurchase:
      currency === KEY_RATE_CURRENCY ? keyRateAt(position.purchases, keyRateOn) : null,
    money: yearOverYearReport(alone).at(0),
  };
}
