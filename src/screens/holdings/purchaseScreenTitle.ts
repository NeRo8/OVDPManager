import { type Operation, awaitsConfirmation } from '@/lib/portfolio/portfolio';

/** A purchase of a bond already bought, not only planned, is a top-up: «Докупити ОВДП». */
export function hasMadePurchase(operations: Operation[]): boolean {
  return operations.some((operation) => operation.type === 'purchase' && !operation.planned);
}

/**
 * The purchase form's title, the same in the header while the form slides in and once it is
 * there: confirming a planned purchase whose date has come, editing a purchase, topping up a bond
 * already bought, or a first purchase of it.
 */
export function purchaseScreenTitle(
  operations: Operation[],
  isin: string | undefined,
  purchaseId: string | undefined,
  today: string,
): string {
  const ofBond = operations.filter((operation) => operation.isin === isin);
  if (purchaseId) {
    // A sale's id opens no purchase.
    const purchase = ofBond.find(
      (operation) => operation.id === purchaseId && operation.type === 'purchase',
    );
    if (!purchase) return 'Купівлі немає';
    return awaitsConfirmation(purchase, today) ? 'Підтвердити купівлю' : 'Змінити купівлю';
  }
  return hasMadePurchase(ofBond) ? 'Докупити ОВДП' : 'Додати купівлю';
}
