import { Fragment } from 'react';

import { updateReportFilters } from '@/features/report-filters';
import { CheckRow, Section, Separator } from '@/shared/ui';
import { useReport } from '../model/useReport.hook';
import { YearFiltersSection } from './YearFiltersSection';

const CURRENCIES = [
  { code: 'USD', title: 'Долар США' },
  { code: 'EUR', title: 'Євро' },
] as const;

/** Year and foreign currency used to measure hryvnia bond cash flows. */
export function FxFiltersSection() {
  const { filters } = useReport('fx');

  return (
    <>
      <YearFiltersSection report="fx" />
      <Section title="Валюта порівняння">
        {CURRENCIES.map(({ code, title }, index) => (
          <Fragment key={code}>
            {index > 0 && <Separator />}
            <CheckRow
              title={title}
              checked={filters.targetCurrency === code}
              onPress={() => updateReportFilters('fx', { targetCurrency: code })}
            />
          </Fragment>
        ))}
      </Section>
    </>
  );
}
