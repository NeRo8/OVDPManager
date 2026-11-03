import type { PlanOperation } from '@/lib/portfolio/portfolio';

export type OperationsState = {
  /** Purchases of every plan */
  operations: PlanOperation[];
};
