import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  differenceInMonths,
  addQuarters,
  eachMonthOfInterval,
  endOfMonth,
  endOfQuarter,
  format,
  parseISO,
  startOfMonth,
  startOfQuarter,
} from 'date-fns';

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

/** An ISO timestamp (a moment, not a calendar date) → DD.MM.YYYY, HH:mm in local time. */
export function formatDateTime(isoTimestamp: string): string {
  return format(parseISO(isoTimestamp), 'dd.MM.yyyy, HH:mm');
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

/** The same day `months` later, clamped to the month's last day (31.01 + 1 → 28.02). */
export function addMonthsISO(isoDate: string, months: number): string {
  return toISODate(addMonths(parseISO(isoDate), months));
}

/** The calendar date `days` later; negative goes back. */
export function addDaysISO(isoDate: string, days: number): string {
  return toISODate(addDays(parseISO(isoDate), days));
}

/** The first and the last day of the date's month, or of the one `offset` months away. */
export function monthRange(isoDate: string, offset = 0): { from: string; to: string } {
  const month = addMonths(parseISO(isoDate), offset);
  return { from: toISODate(startOfMonth(month)), to: toISODate(endOfMonth(month)) };
}

/** The first and the last day of the date's quarter, or of the one `offset` quarters away. */
export function quarterRange(isoDate: string, offset = 0): { from: string; to: string } {
  const quarter = addQuarters(parseISO(isoDate), offset);
  return { from: toISODate(startOfQuarter(quarter)), to: toISODate(endOfQuarter(quarter)) };
}

/** Every month from the first date's to the last's, as YYYY-MM. */
export function monthsBetween(fromISO: string, toISO: string): string[] {
  return eachMonthOfInterval({ start: parseISO(fromISO), end: parseISO(toISO) }).map((month) =>
    format(month, 'yyyy-MM'),
  );
}

export function daysBetween(fromISO: string, toISO: string): number {
  return differenceInCalendarDays(parseISO(toISO), parseISO(fromISO));
}

export function formatDaysLeft(days: number): string {
  if (days === 0) return 'сьогодні';
  if (days === 1) return 'завтра';
  // A no-break space keeps "56 днів" on one line.
  return `через ${days}\u00a0${plural(days, 'день', 'дні', 'днів')}`;
}

/** How long until a date, in whole months: "2 р 3 міс", "8 міс", "12 днів" under a month. */
export function formatTimeLeft(fromISO: string, toISO: string): string {
  const months = differenceInMonths(parseISO(toISO), parseISO(fromISO));
  if (months < 1) {
    const days = daysBetween(fromISO, toISO);
    return `${days}\u00a0${plural(days, 'день', 'дні', 'днів')}`;
  }
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years > 0 && `${years}\u00a0р`, rest > 0 && `${rest}\u00a0міс`].filter(Boolean).join(' ');
}
