/**
 * The plan-name screen's title, the same in the header while the screen slides in and once it is
 * there: renaming a plan, the first plan of the app, or another new one.
 */
export function planNameTitle(planId: string | undefined, isFirst: boolean): string {
  if (planId) return 'Назва плану';
  if (isFirst) return 'Перший план';
  return 'Новий план';
}
