import { plural } from '@/shared/lib';

/** «1 купівля», «2 купівлі», «5 купівель». */
export function purchaseCount(count: number): string {
  return `${count} ${plural(count, 'купівля', 'купівлі', 'купівель')}`;
}

/** «1 план», «2 плани», «5 планів». */
export function planCount(count: number): string {
  return `${count} ${plural(count, 'план', 'плани', 'планів')}`;
}
