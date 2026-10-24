import { useState } from 'react';

import { useWallet } from '@/entities/portfolio';
import { reportYears, yearReport } from './yearReport';

/** The year report of the active plan and the year picked on it, the current one at first. */
export function useYearReport() {
  const wallet = useWallet();
  const { firstYear, lastYear, currentYear } = reportYears(wallet);
  const [chosenYear, setYear] = useState<number | null>(null);
  const year = chosenYear ?? Math.min(Math.max(currentYear, firstYear), lastYear);

  return {
    wallet,
    firstYear,
    lastYear,
    year,
    setYear,
    currencies: yearReport(wallet, year),
  };
}
