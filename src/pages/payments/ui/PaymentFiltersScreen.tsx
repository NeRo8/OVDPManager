import { Stack } from 'expo-router';
import { Fragment } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { CURRENCY_NAMES, type Currency } from '@/entities/portfolio';
import {
  SCHEDULE_EVENT_TYPES,
  filterSchedule,
  resetPaymentFilters,
  togglePaymentFilterIsin,
  togglePaymentFilterType,
  updatePaymentFilters,
  type ScheduleEventType,
  type ScheduleTimeFilter,
} from '@/features/payment-filters';
import { currencySign, formatDate } from '@/shared/lib';
import {
  CheckRow,
  HeaderButton,
  ScreenScrollView,
  Section,
  SegmentedSelect,
  Separator,
  Typography,
} from '@/shared/ui';
import { useFilteredWallet } from '../model/useFilteredWallet.hook';
import { EVENT_TYPE_LABELS, TIME_LABELS } from './paymentFilterLabels';

const TIME_OPTIONS = (['all', 'upcoming', 'past'] as const).map((value) => ({
  label: TIME_LABELS[value],
  value,
}));

/** Narrows the payments schedule; every change applies at once and is remembered. */
export default function PaymentFiltersScreen() {
  const { wallet, filters, options, activeFilterCount } = useFilteredWallet();
  const { events: shown, totalCount } = filterSchedule(wallet, filters);
  // What each type would add, given the other filters.
  const ofAnyType = filterSchedule(wallet, { ...filters, types: [] }).events;
  const typeCount = (type: ScheduleEventType) =>
    ofAnyType.filter((event) => event.type === type).length;

  const currencyCount = (currency: Currency) =>
    filterSchedule(wallet, { ...filters, currency }).events.length;

  const showAllTypes = () => updatePaymentFilters({ types: [] });
  const changeTime = (time: ScheduleTimeFilter) => updatePaymentFilters({ time });
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
      {options.currencies.length > 1 && (
        <Section title="Валюта" footer="Графік має одну шкалу сум, тому показує одну валюту.">
          {options.currencies.map((currency, index) => (
            <Fragment key={currency}>
              {index > 0 && <Separator />}
              <CheckRow
                title={`${currencySign(currency)} ${CURRENCY_NAMES[currency]}`}
                subtitle={`Подій: ${currencyCount(currency)}`}
                checked={currency === filters.currency}
                onPress={() => updatePaymentFilters({ currency })}
              />
            </Fragment>
          ))}
        </Section>
      )}

      <Section title="Події" footer="Графік і підсумки року рахують лише позначені події.">
        <CheckRow
          title="Усі події"
          subtitle={`Подій: ${ofAnyType.length}`}
          checked={filters.types.length === 0}
          onPress={showAllTypes}
        />
        {SCHEDULE_EVENT_TYPES.map((type) => (
          <Fragment key={type}>
            <Separator />
            <CheckRow
              title={EVENT_TYPE_LABELS[type]}
              subtitle={`Подій: ${typeCount(type)}`}
              checked={filters.types.includes(type)}
              onPress={() => togglePaymentFilterType(type)}
            />
          </Fragment>
        ))}
      </Section>

      <Section
        title="Час"
        footer="Майбутні — виплати, яких ще не отримано, і заплановані купівлі; минулі — отримані виплати та зроблені купівлі."
      >
        <View style={styles.picker}>
          <SegmentedSelect options={TIME_OPTIONS} value={filters.time} onChange={changeTime} />
        </View>
      </Section>

      <Section title="ОВДП" footer="Позначте ОВДП, виплати й купівлі яких показувати.">
        <CheckRow title="Усі ОВДП" checked={filters.isins.length === 0} onPress={showAllBonds} />
        {options.isins.map((isin) => {
          const bond = wallet.byIsin.get(isin);
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
          Показано подій: {shown.length} із {totalCount}
        </Typography>
      )}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  picker: { padding: theme.space.md },
}));
