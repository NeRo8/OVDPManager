import { chooseReportBond } from '@/features/report-filters';

import { CURRENCY_NAMES } from '@/entities/portfolio';

import { formatDate } from '@/shared/lib';
import { CheckRow, Section } from '@/shared/ui';

import { useReport } from '../model/useReport.hook';

/** The bond the bond report is about, the one nearest to maturity at first. */
export function BondChoiceSection() {
  const { filters } = useReport('bond');
  const { isin, choices } = filters;

  const chooseBond = (option: string) => chooseReportBond(option, choices[0]?.position.isin);

  return (
    <Section
      title="ОВДП"
      footer="Звіт розповідає про одну ОВДП з гаманця. Спершу обрано ту, що погашається найраніше."
    >
      {choices.map(({ position, bond, currency }) => (
        <CheckRow
          key={position.isin}
          title={position.isin}
          subtitle={
            bond
              ? `${bond.rate}% · ${CURRENCY_NAMES[currency]} · до ${formatDate(bond.maturityDate)}`
              : 'Немає в даних НБУ'
          }
          checked={position.isin === isin}
          onPress={() => chooseBond(position.isin)}
        />
      ))}
    </Section>
  );
}
