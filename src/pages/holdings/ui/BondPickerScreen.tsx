import { Stack, router } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { BondsUnavailable, type Bond } from '@/entities/portfolio';
import { type BondSort, type BondTerm, useBondPicker } from '@/features/add-holding';
import { currencySign, formatDate, formatTimeLeft } from '@/shared/lib';
import { ChipSelect, SectionCell, ThemedSymbolView, Typography, screenContent } from '@/shared/ui';

const CURRENCY_NAMES = { UAH: 'Гривня', USD: 'Долар', EUR: 'Євро' } as const;

const TERM_LABELS: Record<BondTerm, string> = {
  all: 'Усі строки',
  short: 'До 1 року',
  medium: '1–3 роки',
  long: 'Понад 3 роки',
};

const SORT_LABELS: Record<BondSort, string> = {
  maturity: 'За погашенням',
  rate: 'За ставкою',
};

/**
 * First step of adding a purchase: bonds in circulation narrowed by currency and term, sorted by
 * maturity or rate. The header search finds any bond by ISIN.
 */
export default function BondPickerScreen() {
  const picker = useBondPicker();
  const { bonds, error, refresh, today, query, setQuery, isSearching, choices, ownedQuantity } =
    picker;

  if (!bonds) return <BondsUnavailable error={error} onRetry={refresh} />;

  return (
    <>
      <Stack.SearchBar
        placeholder="Пошук за ISIN"
        autoCapitalize="characters"
        onChangeText={(event) => setQuery(event.nativeEvent.text)}
        onCancelButtonPress={() => setQuery('')}
      />
      <FlatList
        style={styles.list}
        contentContainerStyle={[screenContent, styles.content]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        data={choices}
        keyExtractor={(bond) => bond.isin}
        ListHeaderComponent={
          <View style={styles.header}>
            {!isSearching && <PickerFilters picker={picker} />}
            <View style={styles.summary}>
              <Typography variant="footnote" tone="secondary">
                {isSearching ? `Знайдено: ${choices.length}` : `ОВДП: ${choices.length}`}
              </Typography>
              {!isSearching && <SortToggle sort={picker.sort} onChange={picker.setSort} />}
            </View>
          </View>
        }
        renderItem={({ item: bond, index }) => (
          <SectionCell index={index} count={choices.length}>
            <BondChoiceRow
              bond={bond}
              today={today}
              owned={ownedQuantity.get(bond.isin)}
              showCurrency={isSearching}
            />
          </SectionCell>
        )}
        ListEmptyComponent={
          <Typography variant="subhead" tone="secondary" align="center" style={styles.empty}>
            {query.trim() ? 'ОВДП з таким номером не знайдено' : 'За цими фільтрами ОВДП немає'}
          </Typography>
        }
      />
    </>
  );
}

type PickerFiltersProps = {
  picker: ReturnType<typeof useBondPicker>;
};

function PickerFilters({ picker }: PickerFiltersProps) {
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

type SortToggleProps = {
  sort: BondSort;
  onChange: (sort: BondSort) => void;
};

/** Names the order in use; a press switches to the other one. */
function SortToggle({ sort, onChange }: SortToggleProps) {
  return (
    <Pressable
      onPress={() => onChange(sort === 'maturity' ? 'rate' : 'maturity')}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Сортування: ${SORT_LABELS[sort].toLowerCase()}. Змінити`}
      style={({ pressed }) => [styles.sort, pressed && styles.sortPressed]}
    >
      <ThemedSymbolView
        name={{ ios: 'arrow.up.arrow.down', android: 'swap_vert' }}
        size={13}
        weight="semibold"
        uniProps={(theme) => ({ tintColor: theme.accent })}
      />
      <Typography variant="footnote" weight="semibold" tone="accent">
        {SORT_LABELS[sort]}
      </Typography>
    </Pressable>
  );
}

type BondChoiceRowProps = {
  bond: Bond;
  today: string;
  /** Quantity already in the wallet */
  owned?: number;
  /** Search results mix currencies; the filtered list is all in one */
  showCurrency: boolean;
};

/** A bond to choose: what it pays on the right, when it matures and what is owned on the left. */
function BondChoiceRow({ bond, today, owned, showCurrency }: BondChoiceRowProps) {
  const isActive = bond.maturityDate > today;
  const details = [
    showCurrency && bond.currency,
    isActive
      ? `до ${formatDate(bond.maturityDate)} · ${formatTimeLeft(today, bond.maturityDate)}`
      : `погашена ${formatDate(bond.maturityDate)}`,
    owned && `у гаманці ${owned} шт`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/add/[isin]', params: { isin: bond.isin } })}
      accessibilityRole="link"
      accessibilityLabel={`${bond.isin}, ${bond.rate}% річних, ${details}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowText}>
        <Typography variant="body" tabular>
          {bond.isin}
        </Typography>
        <Typography variant="caption1" tone="secondary">
          {details}
        </Typography>
      </View>
      <Typography variant="headline" tabular tone={isActive ? 'primary' : 'secondary'}>
        {bond.rate}%
      </Typography>
      <ThemedSymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right' }}
        size={14}
        weight="semibold"
        uniProps={(theme) => ({ tintColor: theme.secondaryText })}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  list: { backgroundColor: theme.background },
  content: { gap: 0 },
  header: { gap: 14, marginBottom: 12 },
  filters: { gap: 10 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  sort: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortPressed: { opacity: 0.6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  rowText: { flex: 1, gap: 2 },
  pressed: { backgroundColor: theme.muted },
  empty: { marginTop: 28 },
}));
