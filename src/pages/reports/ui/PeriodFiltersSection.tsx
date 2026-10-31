import {
  PERIOD_OPTIONS,
  type PeriodOption,
  chooseReportPeriod,
  periodDates,
  updateReportFilters,
} from '@/features/report-filters';

import { CheckRow, DateField, FieldRow, Section } from '@/shared/ui';

import { PERIOD_LABELS, formatPeriod } from '../lib/periodLabels';
import { useReport } from '../model/useReport.hook';

/** The period the period report covers; the dates can be set by hand only for the own period. */
export function PeriodFiltersSection() {
  const { narrowed, filters } = useReport('period');
  const { dates } = filters;

  const choosePeriod = (option: PeriodOption) => chooseReportPeriod(option, dates);
  const changeFrom = (from: string) =>
    updateReportFilters('period', { custom: { ...dates, from } });
  const changeTo = (to: string) => updateReportFilters('period', { custom: { ...dates, to } });

  return (
    <Section
      title="Період"
      footer="Місяць і квартал — цілі, з виплатами, що ще попереду; останні 12 місяців — повні місяці до поточного; з початку року — по сьогодні включно; увесь план — від першої купівлі до останньої виплати."
    >
      {PERIOD_OPTIONS.map((option) => (
        <CheckRow
          key={option}
          title={PERIOD_LABELS[option]}
          subtitle={
            option === 'custom'
              ? undefined
              : formatPeriod(periodDates(option, narrowed, filters.custom))
          }
          checked={option === filters.period}
          onPress={() => choosePeriod(option)}
        />
      ))}
      {filters.period === 'custom' && (
        <>
          <FieldRow label="З">
            <DateField value={dates.from} onChange={changeFrom} maximumDate={dates.to} />
          </FieldRow>
          <FieldRow label="По">
            <DateField value={dates.to} onChange={changeTo} minimumDate={dates.from} />
          </FieldRow>
        </>
      )}
    </Section>
  );
}
