import { Stack, router, useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/layout/EmptyState';
import { BondsGate } from '@/components/portfolio/BondsGate';
import { useWallet } from '@/hooks/useWallet.hook';
import { isPlannedPurchase } from '@/lib/portfolio/portfolio';

import { AddPurchaseForm } from './AddPurchaseForm';
import { purchaseScreenTitle } from './purchaseScreenTitle';

/**
 * Final step of adding a purchase to the active plan. The form opens once the NBU data has the
 * bond, as it checks the date and previews the payments against it. A top-up from the bond's screen opens here
 * directly, without the bond list before it. With `purchaseId` it edits that purchase: a planned
 * one is confirmed with what the bank or broker really charged, a made one corrected.
 */
export default function AddPurchaseScreen() {
  const { isin, purchaseId } = useLocalSearchParams<{ isin: string; purchaseId?: string }>();
  const { byIsin, positions, today } = useWallet();
  const bond = byIsin.get(isin);
  const position = positions.find((item) => item.position.isin === isin)?.position;
  const purchase = purchaseId
    ? position?.operations.find((item) => item.id === purchaseId && item.type === 'purchase')
    : undefined;
  const operations = position?.operations ?? [];
  // The other operations of the bond: the one edited is the form itself.
  const ownedQuantity = operations
    .filter((item) => item.id !== purchase?.id && !isPlannedPurchase(item, today))
    .reduce((sum, item) => sum + (item.type === 'purchase' ? item.quantity : -item.quantity), 0);
  const title = purchaseScreenTitle(operations, isin, purchaseId, today);

  // Leave the issue open so another purchase can be entered for a different date.
  const closeAdding = () => router.back();

  if (purchaseId && !purchase) {
    return (
      <>
        <Stack.Screen options={{ title }} />
        <EmptyState
          icon="receipt-outline"
          title="Купівлі немає"
          message="Цю купівлю вже видалено з плану або план змінився. Відкрийте ОВДП у гаманці, щоб побачити її купівлі."
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title }} />

      {bond ? (
        <AddPurchaseForm
          bond={bond}
          ownedQuantity={ownedQuantity}
          purchase={purchase}
          onSaved={closeAdding}
        />
      ) : (
        <BondsGate>
          <EmptyState
            icon="search-outline"
            title={isin}
            message="Немає збережених умов цієї ОВДП або даних у каталозі НБУ."
          />
        </BondsGate>
      )}
    </>
  );
}
