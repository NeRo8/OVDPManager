export const light = {
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#111114',
  secondaryText: '#6B6B73',
  border: '#E3E3E8',
  accent: '#1A6FD8',
  accentText: '#FFFFFF',
  positive: '#1E8E3E',
  danger: '#D93025',
  muted: '#F2F2F7',
  // Chart series: blue, orange, aqua; validated all-pairs against `card` in each mode.
  // Light aqua is 2.8:1 on white, so the chart keeps visible legend values and captions.
  seriesPurchase: '#2a78d6',
  seriesNominal: '#eb6834',
  seriesCoupon: '#1baf7a',
  // The same hues stepped to 4.5:1 on `card`, for amounts written in the series color.
  seriesPurchaseText: '#2876d4',
  seriesNominalText: '#cd4d0f',
  seriesCouponText: '#008856',
};

export type AppTheme = typeof light;

export const dark: AppTheme = {
  background: '#000000',
  card: '#1C1C1E',
  text: '#F5F5F7',
  secondaryText: '#9A9AA1',
  border: '#2C2C30',
  accent: '#4C9AFF',
  accentText: '#FFFFFF',
  positive: '#4CC26A',
  danger: '#FF6B5E',
  muted: '#2C2C2E',
  seriesPurchase: '#3987e5',
  seriesNominal: '#d95926',
  seriesCoupon: '#199e70',
  seriesPurchaseText: '#3987e5',
  seriesNominalText: '#dd5c2a',
  seriesCouponText: '#199e70',
};
