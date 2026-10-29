import { updateReportFilters } from '@/features/report-filters';

import { CheckRow, Section } from '@/shared/ui';

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
          <CheckRow
            key={year}
            title={String(year)}
            subtitle={year === currentYear ? 'Цей рік' : undefined}
            checked={filters.year === year}
            onPress={() => updateReportFilters('fx', { year })}
          />
        ))}
      </Section>
      <Section title="Валюта порівняння">
        {CURRENCIES.map(({ code, title }) => (
          <CheckRow
            key={code}
            title={title}
            checked={filters.targetCurrency === code}
            onPress={() => updateReportFilters('fx', { targetCurrency: code })}
          />
        ))}
      </Section>
    </>
  );
}
