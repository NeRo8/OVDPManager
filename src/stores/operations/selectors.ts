import type { PlanOperation } from '@/lib/portfolio/portfolio';

import { useOperationsStore } from './store';

/** Purchases of every plan. */
export function useOperations(): PlanOperation[] {
  return useOperationsStore((state) => state.operations);
}

/** Purchases of every plan. */
export function getOperations(): PlanOperation[] {
  return useOperationsStore.getState().operations;
}
