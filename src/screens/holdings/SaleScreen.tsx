import { useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/layout/EmptyState';
import { useWallet } from '@/hooks/useWallet.hook';

import { SaleForm } from './SaleForm';

export default function SaleScreen() {
  const { isin, operationId } = useLocalSearchParams<{ isin: string; operationId?: string }>();
  const { byIsin, operations } = useWallet();
  const bond = byIsin.get(isin);
  if (
    !bond ||
    !operations.some((operation) => operation.isin === isin) ||
    (operationId &&
      !operations.some(
        (operation) =>
          operation.id === operationId && operation.isin === isin && operation.type === 'sale',
      ))
  ) {
    return (
      <EmptyState
        icon="cash-outline"
        title="Продаж недоступний"
        message="Немає збереженої ОВДП або операції в активному плані."
      />
    );
  }
  return <SaleForm key={`${isin}:${operationId ?? 'new'}`} bond={bond} operationId={operationId} />;
}
