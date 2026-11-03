export type KeyRateYear = {
  /** % a year on every day of the year up to `throughDate`, `YYYY-MM-DD` */
  rates: Record<string, number>;
  /** The last day asked for: 31 December, or the day of the request for the current year */
  throughDate: string;
  /** When NBU sent it, ms */
  updatedAt: number;
};

export type KeyRateState = {
  /** NBU key policy rates by calendar year */
  byYear: Record<string, KeyRateYear>;
};
