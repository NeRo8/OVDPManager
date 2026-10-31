import { CURRENCY_NAMES } from '@/entities/portfolio';

import { InfoRow, Section } from '@/shared/ui';

import type { CurrencyReport } from '../model/periodReport';
import type { ReportTerms } from '../model/reportTerms';

type Props = {
  report: CurrencyReport;
  terms: ReportTerms;
};

/** The «Річна дохідність» of the year's or the period's bonds: their average, the highest, the lowest. */
export function PeriodYield({ report, terms }: Props) {
  const { currency, annualYield, highlights } = report;
  const { highestYield, lowestYield } = highlights;
  if (annualYield === null) return null;

  return (
    <Section
      title={`Дохідність · ${CURRENCY_NAMES[currency]}`}
      footer={`Річна дохідність — за ціною купівлі й усіма виплатами до погашення, як у формі купівлі. Середня — за ОВДП ${terms.span}, зважена на суму купівель; ОВДП без опублікованого погашення в неї не входять.`}
    >
      <InfoRow label="Річна дохідність" hint="Середня за ОВДП" value={`${annualYield}%`} />
      {highestYield && (
        <InfoRow
          label="Найвища річна дохідність"
          hint={highestYield.isin}
          value={`${highestYield.annualYield}%`}
        />
      )}
      {lowestYield && (
        <InfoRow
          label="Найнижча річна дохідність"
          hint={lowestYield.isin}
          value={`${lowestYield.annualYield}%`}
        />
      )}
    </Section>
  );
}
