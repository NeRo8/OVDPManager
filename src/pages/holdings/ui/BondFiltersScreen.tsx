import { currencyTitle } from '@/entities/portfolio';
import {
  type BondSort,
  resetBondPickerFilters,
  updateBondPickerFilters,
  useBondPicker,
} from '@/features/add-purchase';
import {
  CheckRow,
  ResetFiltersHeader,
  ScreenScrollView,
  Section,
  SegmentedSection,
  Typography,
} from '@/shared/ui';
import { SORT_LABELS, TERM_LABELS } from './bondFilterLabels';

const SORT_OPTIONS = (['maturity', 'rate'] as const).map((value) => ({
  label: SORT_LABELS[value],
  value,
}));

/** Narrows and orders the bond picker; every change applies at once and is remembered. */
export default function BondFiltersScreen() {
  const { currencies, currency, terms, term, sort, filteredCount, activeFilterCount } =
    useBondPicker();

  const changeSort = (value: BondSort) => updateBondPickerFilters({ sort: value });

  return (
    <ScreenScrollView>
      <ResetFiltersHeader activeFilterCount={activeFilterCount} onReset={resetBondPickerFilters} />
      {currencies.length > 1 && (
        <Section title="Валюта">
          {currencies.map((option) => (
            <CheckRow
              key={option.value}
              title={currencyTitle(option.value)}
              subtitle={`ОВДП в обігу: ${option.count}`}
              checked={option.value === currency}
              onPress={() => updateBondPickerFilters({ currency: option.value })}
            />
          ))}
        </Section>
      )}

      <Section title="Строк до погашення" footer="Скільки лишилося від сьогодні до погашення.">
        {terms.map((option) => (
          <CheckRow
            key={option.value}
            title={TERM_LABELS[option.value]}
            subtitle={`ОВДП: ${option.count}`}
            checked={option.value === term}
            onPress={() => updateBondPickerFilters({ term: option.value })}
          />
        ))}
      </Section>

      <SegmentedSection
        title="Сортування"
        footer="За погашенням — спершу ті, що погашаються раніше; за ставкою — спершу найвища ставка купона."
        options={SORT_OPTIONS}
        value={sort}
        onChange={changeSort}
      />

      <Typography variant="subhead" tone="secondary" align="center">
        Показано ОВДП: {filteredCount}
      </Typography>
    </ScreenScrollView>
  );
}
