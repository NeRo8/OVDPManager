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

import { currencyTitle, type Currency } from '@/entities/portfolio';

import { formatDate } from '@/shared/lib';
import {
  CheckRow,
  ResetFiltersHeader,
  ScreenScrollView,
  Section,
  SegmentedSection,
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
      <ResetFiltersHeader activeFilterCount={activeFilterCount} onReset={resetPaymentFilters} />
      {options.currencies.length > 1 && (
        <Section title="Валюта" footer="Графік має одну шкалу сум, тому показує одну валюту.">
          {options.currencies.map((currency) => (
            <CheckRow
              key={currency}
              title={currencyTitle(currency)}
              subtitle={`Подій: ${currencyCount(currency)}`}
              checked={currency === filters.currency}
              onPress={() => updatePaymentFilters({ currency })}
            />
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
          <CheckRow
            key={type}
            title={EVENT_TYPE_LABELS[type]}
            subtitle={`Подій: ${typeCount(type)}`}
            checked={filters.types.includes(type)}
            onPress={() => togglePaymentFilterType(type)}
          />
        ))}
      </Section>

      <SegmentedSection
        title="Час"
        footer="Майбутні — виплати, яких ще не отримано, і заплановані купівлі; минулі — отримані виплати та зроблені купівлі."
        options={TIME_OPTIONS}
        value={filters.time}
        onChange={changeTime}
      />

      <Section title="ОВДП" footer="Позначте ОВДП, виплати й купівлі яких показувати.">
        <CheckRow title="Усі ОВДП" checked={filters.isins.length === 0} onPress={showAllBonds} />
        {options.isins.map((isin) => {
          const bond = wallet.byIsin.get(isin);
          return (
            <CheckRow
              key={isin}
              title={isin}
              subtitle={bond && `${bond.rate}% · до ${formatDate(bond.maturityDate)}`}
              checked={filters.isins.includes(isin)}
              onPress={() => togglePaymentFilterIsin(isin)}
            />
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
