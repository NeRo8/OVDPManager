import type { WalletPurchase } from '../portfolio';

export type PurchasesState = {
  /** Purchases of every plan */
  purchases: WalletPurchase[];
};
