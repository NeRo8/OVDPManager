export type ExchangeRateYear = {
  rates: Record<string, number>;
  throughDate: string;
  updatedAt: number;
};
export type ExchangeRateState = { byCurrencyYear: Record<string, ExchangeRateYear> };
