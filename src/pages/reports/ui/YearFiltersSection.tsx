import { Fragment } from 'react';

import { chooseReportYear } from '@/features/report-filters';
import { CheckRow, Section, Separator } from '@/shared/ui';
import { useReport } from '../model/useReport.hook';

/** The year the year report shows, from the plan's first purchase to its last payment. */
export function YearFiltersSection() {
  const { wallet, filters } = useReport('year');
  const { firstYear, lastYear, defaultYear } = filters.years;
  const yearList = Array.from(
    { length: lastYear - firstYear + 1 },
    (_, index) => firstYear + index,
  );
  const currentYear = Number(wallet.today.slice(0, 4));

  const chooseYear = (option: number) => chooseReportYear(option, defaultYear);

  return (
    <Section
      title="Рік"
      footer="Роки — від першої купівлі плану до його останньої виплати. Спершу показано цей рік."
    >
      {yearList.map((option, index) => (
        <Fragment key={option}>
          {index > 0 && <Separator />}
          <CheckRow
            title={String(option)}
            subtitle={option === currentYear ? 'Цей рік' : undefined}
            checked={option === filters.year}
            onPress={() => chooseYear(option)}
          />
        </Fragment>
      ))}
    </Section>
  );
}
