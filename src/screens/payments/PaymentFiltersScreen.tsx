import { SegmentedSection } from '@/components/form/SegmentedSection';
import { CheckRow } from '@/components/layout/CheckRow';
import { ScreenScrollView } from '@/components/layout/ScreenScrollView';
import { Section } from '@/components/layout/Section';
import { ResetFiltersHeader } from '@/components/navigation/ResetFiltersHeader';
import { Typography } from '@/components/typography/Typography';
import { filterSchedule } from '@/lib/payment-filters/filterSchedule';
import { SCHEDULE_EVENT_TYPES } from '@/lib/payment-filters/scheduleEventTypes';
import { currencyTitle, type Currency } from '@/lib/portfolio/portfolio';
import { isinsIn } from '@/lib/portfolio/wallet';
import {
  resetPaymentFilters,
  togglePaymentFilterIsin,
  togglePaymentFilterType,
  updatePaymentFilters,
  type ScheduleEventType,
  type ScheduleTimeFilter,
} from '@/stores/paymentFilters';
import { formatDate } from '@/utils/date';
import { formatPercent } from '@/utils/format';

import { EVENT_TYPE_LABELS, TIME_LABELS } from './paymentFilterLabels';
import { useFilteredWallet } from './useFilteredWallet.hook';

const TIME_OPTIONS = (['all', 'upcoming', 'past'] as const).map((value) => ({
  label: TIME_LABELS[value],
  value,
}));

/** Narrows the payments schedule; every change applies at once and is remembered. */
export default function PaymentFiltersScreen() {
  const { wallet, filters, options, activeFilterCount, withCurrency } = useFilteredWallet();
  const { events: shown, totalCount } = filterSchedule(wallet, filters);
  // What each type would add, given the other filters.
  const ofAnyType = filterSchedule(wallet, { ...filters, types: [] }).events;
  const typeCount = (type: ScheduleEventType) =>
    ofAnyType.filter((event) => event.type === type).length;

  // As picking it would show: the bonds ticked of that currency, every bond when none is.
  const currencyCount = (currency: Currency) =>
    filterSchedule(wallet, withCurrency(currency)).events.length;

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
        {isinsIn(options, filters.currency).map((isin) => {
          const bond = wallet.byIsin.get(isin);
          return (
            <CheckRow
              key={isin}
              title={isin}
              subtitle={
                bond
                  ? `${formatPercent(bond.rate)} · до ${formatDate(bond.maturityDate)}`
                  : 'Немає даних НБУ'
              }
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
