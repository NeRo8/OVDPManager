import { Stack } from 'expo-router';
import { Fragment } from 'react';

import { CURRENCY_NAMES } from '@/entities/portfolio';
import { chooseBondReportIsin, resetBondReportFilters } from '@/features/report-filters';
import { formatDate } from '@/shared/lib';
import { CheckRow, HeaderButton, ScreenScrollView, Section, Separator } from '@/shared/ui';
import { useBondReport } from '../model/useBondReport.hook';

/** The bond the bond report is about; a change applies at once and is remembered. */
export default function BondReportFiltersScreen() {
  const { choices, isin, defaultIsin, activeFilterCount } = useBondReport();

  const chooseBond = (option: string) => chooseBondReportIsin(option, defaultIsin);

  return (
    <ScreenScrollView>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderButton
              icon="refresh"
              accessibilityLabel="Скинути фільтри"
              onPress={resetBondReportFilters}
              disabled={activeFilterCount === 0}
            />
          ),
        }}
      />
      <Section
        title="ОВДП"
        footer="Звіт розповідає про одну ОВДП з гаманця. Спершу обрано ту, що погашається найраніше."
      >
        {choices.map(({ position, bond, currency }, index) => (
          <Fragment key={position.isin}>
            {index > 0 && <Separator />}
            <CheckRow
              title={position.isin}
              subtitle={
                bond
                  ? `${bond.rate}% · ${CURRENCY_NAMES[currency]} · до ${formatDate(bond.maturityDate)}`
                  : 'Немає в даних НБУ'
              }
              checked={position.isin === isin}
              onPress={() => chooseBond(position.isin)}
            />
          </Fragment>
        ))}
      </Section>
    </ScreenScrollView>
  );
}
