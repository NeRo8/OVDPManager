import { chooseReportBond } from '@/features/report-filters';

import { CURRENCY_NAMES } from '@/entities/portfolio';

import { formatDate } from '@/shared/lib';
import { CheckRow, Section } from '@/shared/ui';

import { useReport } from '../model/useReport.hook';

/** The bond the bond report is about: at first the next maturity ahead, or the last redeemed. */
export function BondChoiceSection() {
  const { filters } = useReport('bond');
  const { isin, choices, defaultIsin } = filters;

  const chooseBond = (option: string) => chooseReportBond(option, defaultIsin);

  return (
    <Section
      title="ОВДП"
      footer="Звіт розповідає про одну ОВДП з гаманця. Спершу обрано ту, що погашається найближчим часом; коли всі погашено — погашену останньою."
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
