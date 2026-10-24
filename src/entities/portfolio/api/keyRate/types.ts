export type KeyRate = {
  /** % a year */
  rate: number;
  /** When NBU sent it, ms */
  updatedAt: number;
};

export type KeyRateState = {
  /** The rate in effect on each date it was asked for, `YYYY-MM-DD` */
  byDate: Record<string, KeyRate>;
};
