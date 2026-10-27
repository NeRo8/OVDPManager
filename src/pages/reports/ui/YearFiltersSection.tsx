import { chooseReportYear } from '@/features/report-filters';
import { CheckRow, Section } from '@/shared/ui';
import { useReport } from '../model/useReport.hook';

type Props = { report: 'year' };

/** The year selected for an annual report. */
export function YearFiltersSection({ report }: Props) {
  const { wallet, filters } = useReport(report);
  const { firstYear, lastYear, defaultYear } = filters.years;
  const yearList = Array.from(
    { length: lastYear - firstYear + 1 },
    (_, index) => firstYear + index,
  );
  const currentYear = Number(wallet.today.slice(0, 4));

  const chooseYear = (option: number) => chooseReportYear(report, option, defaultYear);

  return (
    <Section
      title="Рік"
      footer="Роки — від першої купівлі плану до його останньої виплати. Спершу показано цей рік."
    >
      {yearList.map((option) => (
        <CheckRow
          key={option}
          title={String(option)}
          subtitle={option === currentYear ? 'Цей рік' : undefined}
          checked={option === filters.year}
          onPress={() => chooseYear(option)}
        />
      ))}
    </Section>
  );
}
