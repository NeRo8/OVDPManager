import { Stack, router, useLocalSearchParams } from 'expo-router';

import { BondsUnavailable, useWallet } from '@/entities/portfolio';
import { EmptyState } from '@/shared/ui';
import { AddPurchaseForm } from './AddPurchaseForm';

/**
 * Second step of adding a purchase to the active plan. The form opens once the NBU data has the
 * bond, as it checks the date and previews the payments against it. A top-up from the bond's screen opens here
 * directly, without the bond list before it.
 */
export default function AddPurchaseScreen() {
  const { isin, topUp } = useLocalSearchParams<{ isin: string; topUp?: string }>();
  const { bonds, byIsin, error, refresh, positions } = useWallet();
  const bond = byIsin.get(isin);
  const ownedQuantity =
    positions.find(({ position }) => position.isin === isin)?.position.quantity ?? 0;

  // Back to where adding started: past the bond list, or straight back for a top-up.
  const closeAdding = () => router.dismiss(topUp ? 1 : 2);
  const header = (
    <Stack.Screen options={{ title: ownedQuantity > 0 ? 'Докупити ОВДП' : 'Додати ОВДП' }} />
  );

  if (!bonds) {
    return (
      <>
        {header}
        <BondsUnavailable error={error} onRetry={refresh} />
      </>
    );
  }

  if (!bond) {
    return (
      <>
        {header}
        <EmptyState title={isin} message="Цієї ОВДП немає в даних НБУ." />
      </>
    );
  }

  return (
    <>
      {header}
      <AddPurchaseForm bond={bond} ownedQuantity={ownedQuantity} onSaved={closeAdding} />
    </>
  );
}
