import { useLocalSearchParams } from 'expo-router';

import { useToday } from '@/stores/appSettings';

import { parseReportParams, type ReportName } from './reportParams';

export function useReportParams(name: ReportName) {
  const params = useLocalSearchParams();
  const today = useToday();
  return parseReportParams(params, today, name);
}
