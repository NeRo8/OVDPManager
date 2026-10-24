import type { StructurePurchases } from '@/features/report-filters';
import type { TermBucket } from '../model/structureReport';

export const STRUCTURE_PURCHASES_LABELS: Record<StructurePurchases, string> = {
  all: 'Із запланованими',
  made: 'Лише зроблені',
};

/** Under the report's date: which money it splits. */
export const STRUCTURE_PURCHASES_TITLES: Record<StructurePurchases, string> = {
  all: 'ОВДП в обігу, із запланованими купівлями',
  made: 'ОВДП в обігу, лише зроблені купівлі',
};

export const TERM_BUCKET_LABELS: Record<TermBucket, string> = {
  halfYear: 'До 6 місяців',
  year: '6–12 місяців',
  twoYears: '1–2 роки',
  threeYears: '2–3 роки',
  longer: 'Понад 3 роки',
};
