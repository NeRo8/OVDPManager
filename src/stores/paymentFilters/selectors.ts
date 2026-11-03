import { usePaymentFiltersStore } from './store';
import type { PaymentFilters } from './types';

export function usePaymentFilters(): PaymentFilters {
  return usePaymentFiltersStore();
}
