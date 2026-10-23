import { Stack } from 'expo-router';
import { Fragment } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import {
  resetPaymentFilters,
  togglePaymentFilterIsin,
  updatePaymentFilters,
  type PaymentFilters,
} from '@/features/payment-filters';
import { formatDate } from '@/shared/lib';
import {
  CheckRow,
  HeaderButton,
  ScreenScrollView,
  Section,
  SegmentedSelect,
  Separator,
  Typography,
} from '@/shared/ui';
import { upcomingPayments } from '../model/upcomingPayments';
import { useFilteredWallet } from '../model/useFilteredWallet.hook';

const KIND_OPTIONS: { label: string; value: PaymentFilters['kind'] }[] = [
  { label: 'Усі', value: 'all' },
  { label: 'Купони', value: 'coupon' },
  { label: 'Погашення', value: 'redemption' },
];

const PERIOD_OPTIONS: { label: string; value: PaymentFilters['period'] }[] = [
  { label: 'Усі', value: 'all' },
  { label: '3 міс', value: 3 },
  { label: '6 міс', value: 6 },
  { label: 'Рік', value: 12 },
];

/** Narrows the upcoming payments; every change applies at once and is remembered. */
export default function PaymentFiltersScreen() {
  const filtered = useFilteredWallet();
  const { filters, options: filterOptions, activeFilterCount } = filtered;
  const { byIsin } = filtered.wallet;
  const { upcoming, allCount } = upcomingPayments(filtered);
  const currencyOptions: { label: string; value: PaymentFilters['currency'] }[] = [
    { label: 'Усі', value: 'all' },
    ...filterOptions.currencies.map((currency) => ({ label: currency, value: currency })),
  ];

  const changeKind = (kind: PaymentFilters['kind']) => updatePaymentFilters({ kind });
  const changePeriod = (period: PaymentFilters['period']) => updatePaymentFilters({ period });
  const changeCurrency = (currency: PaymentFilters['currency']) =>
    updatePaymentFilters({ currency });
  const showAllBonds = () => updatePaymentFilters({ isins: [] });

  return (
    <ScreenScrollView>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderButton
              icon="refresh"
              accessibilityLabel="Скинути фільтри"
              onPress={resetPaymentFilters}
              disabled={activeFilterCount === 0}
            />
          ),
        }}
      />
      <Section title="Тип виплати">
        <View style={styles.picker}>
          <SegmentedSelect options={KIND_OPTIONS} value={filters.kind} onChange={changeKind} />
        </View>
      </Section>

      <Section
        title="Період"
        footer="Для майбутніх виплат: від сьогодні до кінця періоду. У режимі «За рік» рік обирають на екрані виплат."
      >
        <View style={styles.picker}>
          <SegmentedSelect
            options={PERIOD_OPTIONS}
            value={filters.period}
            onChange={changePeriod}
          />
        </View>
      </Section>

      {filterOptions.currencies.length > 1 && (
        <Section title="Валюта">
          <View style={styles.picker}>
            <SegmentedSelect
              options={currencyOptions}
              value={filters.currency}
              onChange={changeCurrency}
            />
          </View>
        </Section>
      )}

      <Section title="ОВДП" footer="Позначте облігації, виплати яких показувати.">
        <CheckRow title="Усі ОВДП" checked={filters.isins.length === 0} onPress={showAllBonds} />
        {filterOptions.isins.map((isin) => {
          const bond = byIsin.get(isin);
          return (
            <Fragment key={isin}>
              <Separator />
              <CheckRow
                title={isin}
                subtitle={bond && `${bond.rate}% · до ${formatDate(bond.maturityDate)}`}
                checked={filters.isins.includes(isin)}
                onPress={() => togglePaymentFilterIsin(isin)}
              />
            </Fragment>
          );
        })}
      </Section>

      {activeFilterCount > 0 && (
        <Typography variant="subhead" tone="secondary" align="center">
          Показано виплат: {upcoming.length} із {allCount}
        </Typography>
      )}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  picker: { padding: theme.space.md },
}));
