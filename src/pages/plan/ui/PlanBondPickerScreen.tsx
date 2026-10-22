import { router, Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { BondsUnavailable, useInvestmentPlans } from '@/entities/portfolio';
import { type BondTerm, useBondPicker } from '@/features/add-purchase';
import { formatDate } from '@/shared/lib';
import {
  ChipSelect,
  EmptyState,
  SectionCell,
  ThemedSymbolView,
  Typography,
  screenContent,
} from '@/shared/ui';

const TERM_LABELS: Record<BondTerm, string> = {
  all: 'Усі строки',
  short: 'До 1 року',
  medium: '1–3 роки',
  long: 'Понад 3 роки',
};

export default function PlanBondPickerScreen() {
  const { planId } = useLocalSearchParams<{ planId?: string }>();
  const plans = useInvestmentPlans();
  const picker = useBondPicker();
  const { bonds, error, refresh, query, setQuery, isSearching, choices, today } = picker;
  if (!planId || !plans.some((plan) => plan.id === planId))
    return <EmptyState title="План не знайдено" message="Поверніться до списку планів." />;
  if (!bonds) return <BondsUnavailable error={error} onRetry={refresh} />;

  const available = choices.filter((bond) => bond.maturityDate > today);
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
        contentContainerStyle={screenContent}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        data={available}
        keyExtractor={(bond) => bond.isin}
        ListHeaderComponent={
          <View style={styles.header}>
            {!isSearching && (
              <>
                {picker.currencies.length > 1 && (
                  <ChipSelect
                    options={picker.currencies.map(({ value }) => ({ label: value, value }))}
                    value={picker.currency}
                    onChange={picker.setCurrency}
                  />
                )}
                <ChipSelect
                  options={picker.terms
                    .filter(({ value, count }) => value === 'all' || count > 0)
                    .map(({ value }) => ({ label: TERM_LABELS[value], value }))}
                  value={picker.term}
                  onChange={picker.setTerm}
                />
              </>
            )}
            <Typography variant="footnote" tone="secondary">
              ОВДП: {available.length}
            </Typography>
          </View>
        }
        renderItem={({ item, index }) => (
          <SectionCell index={index} count={available.length}>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/plan/new/[isin]', params: { isin: item.isin, planId } })
              }
              accessibilityRole="link"
              accessibilityLabel={`${item.isin}, ${item.rate}% річних, до ${formatDate(item.maturityDate)}`}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={styles.details}>
                <Typography variant="body" tabular>
                  {item.isin}
                </Typography>
                <Typography variant="caption1" tone="secondary">
                  {item.currency} · до {formatDate(item.maturityDate)}
                </Typography>
              </View>
              <Typography variant="headline" tabular>
                {item.rate}%
              </Typography>
              <ThemedSymbolView
                name={{ ios: 'chevron.right', android: 'chevron_right' }}
                size={14}
                uniProps={(theme) => ({ tintColor: theme.secondaryText })}
              />
            </Pressable>
          </SectionCell>
        )}
        ListEmptyComponent={
          <Typography variant="subhead" tone="secondary" align="center" style={styles.empty}>
            {query.trim() ? 'Чинну ОВДП не знайдено' : 'За цими фільтрами ОВДП немає'}
          </Typography>
        }
      />
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  list: { backgroundColor: theme.background },
  header: { gap: 14, marginBottom: 12, paddingHorizontal: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  details: { flex: 1, gap: 2 },
  pressed: { backgroundColor: theme.muted },
  empty: { marginTop: 28 },
}));
