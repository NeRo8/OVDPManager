import { Stack, router, useLocalSearchParams } from 'expo-router';

import { BondsGate, useWallet } from '@/entities/portfolio';

import { EmptyState } from '@/shared/ui';

import { AddPurchaseForm } from './AddPurchaseForm';

/**
 * Final step of adding a purchase to the active plan. The form opens once the NBU data has the
 * bond, as it checks the date and previews the payments against it. A top-up from the bond's screen opens here
 * directly, without the bond list before it.
 */
export default function AddPurchaseScreen() {
  const { isin } = useLocalSearchParams<{ isin: string }>();
  const { byIsin, positions } = useWallet();
  const bond = byIsin.get(isin);
  const ownedQuantity =
    positions.find(({ position }) => position.isin === isin)?.position.quantity ?? 0;

  // Leave the issue open so another purchase can be entered for a different date.
  const closeAdding = () => router.back();

  return (
    <>
      <Stack.Screen options={{ title: ownedQuantity > 0 ? 'Докупити ОВДП' : 'Додати купівлю' }} />
      <BondsGate>
        {bond ? (
          <AddPurchaseForm bond={bond} ownedQuantity={ownedQuantity} onSaved={closeAdding} />
        ) : (
          <EmptyState icon="search-outline" title={isin} message="Цієї ОВДП немає в даних НБУ." />
        )}
      </BondsGate>
    </>
  );
}
