/**
 * How many bonds a position holds, and how many of them are still only planned: «10 шт», «10 шт ·
 * заплановано», «10 шт, з них 3 заплановано».
 */
export function ownedLabel(quantity: number, planned: number): string {
  if (planned === 0) return `${quantity} шт`;
  if (planned >= quantity) return `${quantity} шт · заплановано`;
  return `${quantity} шт, з них ${planned} заплановано`;
}
