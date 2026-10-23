import type { WalletPurchase } from '../portfolio';
import { usePurchasesStore } from './store';

/** Purchases of every plan. */
export function usePurchases(): WalletPurchase[] {
  return usePurchasesStore((state) => state.purchases);
}
