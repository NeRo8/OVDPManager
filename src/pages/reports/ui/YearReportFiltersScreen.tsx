import { Stack } from 'expo-router';
import { Fragment } from 'react';

import {
  chooseYearReportYear,
  resetYearReportFilters,
  toggleYearReportIsin,
  updateYearReportFilters,
} from '@/features/report-filters';
import { CheckRow, HeaderButton, ScreenScrollView, Section, Separator } from '@/shared/ui';
import { useYearReport } from '../model/useYearReport.hook';
import { ReportScopeSections } from './ReportScopeSections';

/** The year of the year report and what it covers; every change applies at once and is remembered. */
export default function YearReportFiltersScreen() {
  const { wallet, filters, options, years, year, activeFilterCount } = useYearReport();
  const { firstYear, lastYear, defaultYear } = years;
  const yearList = Array.from(
    { length: lastYear - firstYear + 1 },
    (_, index) => firstYear + index,
  );
  const currentYear = Number(wallet.today.slice(0, 4));

  const chooseYear = (option: number) => chooseYearReportYear(option, defaultYear);

  return (
    <ScreenScrollView>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderButton
              icon="refresh"
              accessibilityLabel="Скинути фільтри"
              onPress={resetYearReportFilters}
              disabled={activeFilterCount === 0}
            />
          ),
        }}
      />
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
              checked={option === year}
              onPress={() => chooseYear(option)}
            />
          </Fragment>
        ))}
      </Section>

      <ReportScopeSections
        wallet={wallet}
        scope={filters}
        options={options}
        onChange={updateYearReportFilters}
        onToggleIsin={toggleYearReportIsin}
      />
    </ScreenScrollView>
  );
}
