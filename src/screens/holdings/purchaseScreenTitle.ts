import { type Purchase, isPlannedPurchase } from '@/lib/portfolio/portfolio';

/** A purchase of a bond already bought, not only planned, is a top-up: «Докупити ОВДП». */
export function hasMadePurchase(purchases: Purchase[], today: string): boolean {
  return purchases.some((purchase) => !isPlannedPurchase(purchase, today));
}

/**
 * The purchase form's title, the same in the header while the form slides in and once it is
 * there: editing a purchase, topping up a bond already bought, or a first purchase of it.
 */
export function purchaseScreenTitle(
  purchases: Purchase[],
  isin: string | undefined,
  purchaseId: string | undefined,
  today: string,
): string {
  const ofBond = purchases.filter((purchase) => purchase.isin === isin);
  if (purchaseId) {
    return ofBond.some((purchase) => purchase.id === purchaseId)
      ? 'Змінити купівлю'
      : 'Купівлі немає';
  }
  return hasMadePurchase(ofBond, today) ? 'Докупити ОВДП' : 'Додати купівлю';
}
