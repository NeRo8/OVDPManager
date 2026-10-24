import { Stack } from 'expo-router';
import { Fragment } from 'react';

import {
  PERIOD_OPTIONS,
  choosePeriodReportPeriod,
  periodDates,
  resetPeriodReportFilters,
  togglePeriodReportIsin,
  updatePeriodReportFilters,
  type PeriodOption,
} from '@/features/report-filters';
import {
  CheckRow,
  DateField,
  FieldRow,
  HeaderButton,
  ScreenScrollView,
  Section,
  Separator,
} from '@/shared/ui';
import { useReportPeriod } from '../model/useReportPeriod.hook';
import { PERIOD_LABELS, formatPeriod } from './periodLabels';
import { ReportScopeSections } from './ReportScopeSections';

/**
 * The period of the period report and what it covers; every change applies at once and is
 * remembered. The dates can be set by hand only for the own period.
 */
export default function PeriodReportFiltersScreen() {
  const { wallet, filters, options, period, activeFilterCount } = useReportPeriod();
  const isCustom = filters.period === 'custom';

  const choosePeriod = (option: PeriodOption) => choosePeriodReportPeriod(option, period);
  const changeFrom = (from: string) => updatePeriodReportFilters({ custom: { ...period, from } });
  const changeTo = (to: string) => updatePeriodReportFilters({ custom: { ...period, to } });

  return (
    <ScreenScrollView>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderButton
              icon="refresh"
              accessibilityLabel="Скинути фільтри"
              onPress={resetPeriodReportFilters}
              disabled={activeFilterCount === 0}
            />
          ),
        }}
      />
      <Section
        title="Період"
        footer="Місяць і квартал — цілі, з виплатами, що ще попереду; рік і 12 місяців — по сьогодні включно; увесь план — від першої купівлі до останньої виплати."
      >
        {PERIOD_OPTIONS.map((option, index) => (
          <Fragment key={option}>
            {index > 0 && <Separator />}
            <CheckRow
              title={PERIOD_LABELS[option]}
              subtitle={
                option === 'custom'
                  ? undefined
                  : formatPeriod(periodDates(option, wallet, filters.custom))
              }
              checked={option === filters.period}
              onPress={() => choosePeriod(option)}
            />
          </Fragment>
        ))}
        {isCustom && (
          <>
            <Separator />
            <FieldRow label="З">
              <DateField value={period.from} onChange={changeFrom} maximumDate={period.to} />
            </FieldRow>
            <Separator />
            <FieldRow label="По">
              <DateField value={period.to} onChange={changeTo} minimumDate={period.from} />
            </FieldRow>
          </>
        )}
      </Section>

      <ReportScopeSections
        wallet={wallet}
        scope={filters}
        options={options}
        onChange={updatePeriodReportFilters}
        onToggleIsin={togglePeriodReportIsin}
      />
    </ScreenScrollView>
  );
}
