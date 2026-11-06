import { router } from 'expo-router';

import { LinkRow } from '@/components/layout/LinkRow';
import { ScreenScrollView } from '@/components/layout/ScreenScrollView';
import { Section } from '@/components/layout/Section';
import { useWallet } from '@/hooks/useWallet.hook';
import { periodDates } from '@/screens/reports/shared/periodDates';
import {
  parseReportParams,
  REPORT_ROUTES,
  serializeReportParams,
  type ReportName,
} from '@/screens/reports/shared/reportParams';

export default function ReportsScreen() {
  const wallet = useWallet();
  const openReport = (report: ReportName) => {
    const selection = {
      ...parseReportParams({}, wallet.today, report),
      ...periodDates('last12Months', wallet),
      isin: wallet.positions[0]?.position.isin ?? null,
    };
    router.push({
      pathname: REPORT_ROUTES[report],
      params: serializeReportParams(selection, report),
    });
  };
  return (
    <ScreenScrollView>
      <Section title="Рух грошей">
        <LinkRow
          title="Валютний еквівалент"
          subtitle="Гривневі операції та виплати в іноземній валюті"
          onPress={() => openReport('fx')}
        />
        <LinkRow
          title="Звіт за період"
          subtitle="Рух грошей між обраними датами"
          onPress={() => openReport('period')}
        />
        <LinkRow
          title="Звіт від року до року"
          subtitle="Результати плану за кожен рік"
          onPress={() => openReport('year-over-year')}
        />
        <LinkRow
          title="Графік погашень"
          subtitle="Погашення за роками й кварталами"
          onPress={() => openReport('redemptions')}
        />
      </Section>
      <Section title="Портфель">
        <LinkRow
          title="Звіт по портфелю"
          subtitle="Вкладення та надходження за облігаціями"
          onPress={() => openReport('portfolio')}
        />
        <LinkRow
          title="Структура портфеля"
          subtitle="Розподіл вкладень за облігаціями"
          onPress={() => openReport('structure')}
        />
        <LinkRow
          title="Річна дохідність"
          subtitle="Дохідність облігацій і облікова ставка НБУ"
          onPress={() => openReport('yield')}
        />
        <LinkRow
          title="Звіт по облігації"
          subtitle="Купівлі, виплати й дохід однієї облігації"
          onPress={() => openReport('bond')}
        />
      </Section>
    </ScreenScrollView>
  );
}
