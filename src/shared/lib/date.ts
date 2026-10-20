import { differenceInCalendarDays, format, parseISO } from 'date-fns';

import { plural } from './format';

/**
 * Dates live in the app as calendar strings, YYYY-MM-DD: that is how the NBU sends them and how
 * they are stored, and they compare and sort correctly as plain strings. Date objects appear
 * only inside these helpers, always in local time, so no UTC shift moves a day.
 */
const ISO_DATE = 'yyyy-MM-dd';

/** YYYY-MM-DD → DD.MM.YYYY */
export function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), 'dd.MM.yyyy');
}

/** Local calendar date as YYYY-MM-DD. */
export function toISODate(date: Date): string {
  return format(date, ISO_DATE);
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** Local midnight of the calendar date. */
export function fromISODate(isoDate: string): Date {
  return parseISO(isoDate);
}

export function daysBetween(fromISO: string, toISO: string): number {
  return differenceInCalendarDays(parseISO(toISO), parseISO(fromISO));
}

export function formatDaysLeft(days: number): string {
  if (days === 0) return 'сьогодні';
  if (days === 1) return 'завтра';
  return `через ${days} ${plural(days, 'день', 'дні', 'днів')}`;
}
