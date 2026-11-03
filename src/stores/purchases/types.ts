import type { PlanPurchase } from '@/lib/portfolio/portfolio';

export type PurchasesState = {
  /** Purchases of every plan */
  purchases: PlanPurchase[];
};
