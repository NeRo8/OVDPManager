import { useColorScheme } from '@/hooks/use-color-scheme';

const light = {
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
  // Chart series: categorical slots 1–2, validated (CVD, contrast) against `card` in each mode.
  seriesCoupon: '#2a78d6',
  seriesNominal: '#eb6834',
};

const dark: typeof light = {
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
  seriesCoupon: '#3987e5',
  seriesNominal: '#d95926',
};

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}
