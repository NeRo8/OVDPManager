import { Stack } from 'expo-router';
import { Fragment } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { CURRENCY_NAMES } from '@/entities/portfolio';
import {
  type BondSort,
  resetBondPickerFilters,
  updateBondPickerFilters,
  useBondPicker,
} from '@/features/add-purchase';
import { currencySign } from '@/shared/lib';
import {
  CheckRow,
  HeaderButton,
  ScreenScrollView,
  Section,
  SegmentedSelect,
  Separator,
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
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderButton
              icon="refresh"
              accessibilityLabel="Скинути фільтри"
              onPress={resetBondPickerFilters}
              disabled={activeFilterCount === 0}
            />
          ),
        }}
      />
      {currencies.length > 1 && (
        <Section title="Валюта">
          {currencies.map((option, index) => (
            <Fragment key={option.value}>
              {index > 0 && <Separator />}
              <CheckRow
                title={`${currencySign(option.value)} ${CURRENCY_NAMES[option.value]}`}
                subtitle={`ОВДП в обігу: ${option.count}`}
                checked={option.value === currency}
                onPress={() => updateBondPickerFilters({ currency: option.value })}
              />
            </Fragment>
          ))}
        </Section>
      )}

      <Section title="Строк до погашення" footer="Скільки лишилося від сьогодні до погашення.">
        {terms.map((option, index) => (
          <Fragment key={option.value}>
            {index > 0 && <Separator />}
            <CheckRow
              title={TERM_LABELS[option.value]}
              subtitle={`ОВДП: ${option.count}`}
              checked={option.value === term}
              onPress={() => updateBondPickerFilters({ term: option.value })}
            />
          </Fragment>
        ))}
      </Section>

      <Section
        title="Сортування"
        footer="За погашенням — спершу ті, що погашаються раніше; за ставкою — спершу найвища ставка купона."
      >
        <View style={styles.picker}>
          <SegmentedSelect options={SORT_OPTIONS} value={sort} onChange={changeSort} />
        </View>
      </Section>

      <Typography variant="subhead" tone="secondary" align="center">
        Показано ОВДП: {filteredCount}
      </Typography>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  picker: { padding: theme.space.md },
}));
