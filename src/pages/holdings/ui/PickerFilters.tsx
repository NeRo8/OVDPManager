import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { type BondTerm, useBondPicker } from '@/features/add-purchase';
import { currencySign } from '@/shared/lib';
import { ChipSelect } from '@/shared/ui';

const CURRENCY_NAMES = { UAH: 'Гривня', USD: 'Долар', EUR: 'Євро' } as const;

const TERM_LABELS: Record<BondTerm, string> = {
  all: 'Усі строки',
  short: 'До 1 року',
  medium: '1–3 роки',
  long: 'Понад 3 роки',
};

type PickerFiltersProps = {
  picker: ReturnType<typeof useBondPicker>;
};

export function PickerFilters({ picker }: PickerFiltersProps) {
  const { currencies, currency, setCurrency, terms, term, setTerm } = picker;
  return (
    <View style={styles.filters}>
      {currencies.length > 1 && (
        <ChipSelect
          options={currencies.map((option) => ({
            label: `${currencySign(option.value)} ${CURRENCY_NAMES[option.value]} · ${option.count}`,
            value: option.value,
          }))}
          value={currency}
          onChange={setCurrency}
        />
      )}
      <ChipSelect
        options={terms
          .filter((option) => option.value === 'all' || option.count > 0)
          .map((option) => ({ label: TERM_LABELS[option.value], value: option.value }))}
        value={term}
        onChange={setTerm}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  filters: { gap: theme.space.sm },
}));
