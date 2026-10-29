export type ExchangeRateYear = {
  /** Official hryvnia per one USD or EUR, by calendar date. */
  rates: Record<string, number>;
  throughDate: string;
  updatedAt: number;
};

export type ExchangeRateState = {
  byCurrencyYear: Record<string, ExchangeRateYear>;
};
