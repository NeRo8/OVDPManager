import { Fragment } from 'react';

import { updateReportFilters } from '@/features/report-filters';
import { CheckRow, Section, Separator } from '@/shared/ui';
import { useReport } from '../model/useReport.hook';

const CURRENCIES = [
  { code: 'USD', title: 'Долар США' },
  { code: 'EUR', title: 'Євро' },
] as const;

/** All time or one year, and the foreign currency for UAH bond cash flows. */
export function FxFiltersSection() {
  const { wallet, filters } = useReport('fx');
  const { firstYear, lastYear } = filters.years;
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
  const currentYear = Number(wallet.today.slice(0, 4));

  return (
    <>
      <Section
        title="Період"
        footer="Увесь час — від першої купівлі гривневої ОВДП до сьогодні. Можна обрати й окремий рік."
      >
        <CheckRow
          title="Увесь час"
          checked={filters.year === null}
          onPress={() => updateReportFilters('fx', { year: null })}
        />
        {years.map((year) => (
          <Fragment key={year}>
            <Separator />
            <CheckRow
              title={String(year)}
              subtitle={year === currentYear ? 'Цей рік' : undefined}
              checked={filters.year === year}
              onPress={() => updateReportFilters('fx', { year })}
            />
          </Fragment>
        ))}
      </Section>
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
