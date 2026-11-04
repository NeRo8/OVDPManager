import { plural } from '@/utils/format';

/** «1 план», «2 плани», «5 планів». */
export function planCount(count: number): string {
  return `${count} ${plural(count, 'план', 'плани', 'планів')}`;
}

/** Purchases and sales together. */
export function operationCount(count: number): string {
  return `${count} ${plural(count, 'операція', 'операції', 'операцій')}`;
}
