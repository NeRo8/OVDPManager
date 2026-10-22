import { Stack, router } from 'expo-router';
import { FlatList, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { BondsUnavailable } from '@/entities/portfolio';
import { useBondPicker } from '@/features/add-purchase';
import { SectionCell, Typography, screenContent } from '@/shared/ui';
import { BondChoiceRow } from './BondChoiceRow';
import { PickerFilters } from './PickerFilters';
import { SortToggle } from './SortToggle';

/**
 * First step of adding a purchase to the active plan: bonds in circulation narrowed by currency
 * and term, sorted by maturity or rate. The header search finds any bond by ISIN.
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
              onPress={() => router.push({ pathname: '/add/[isin]', params: { isin: bond.isin } })}
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

const styles = StyleSheet.create((theme) => ({
  list: { backgroundColor: theme.background },
  content: { gap: 0 },
  header: { gap: theme.space.md, marginBottom: theme.space.md },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space.lg,
  },
  empty: { marginTop: theme.space.xl },
}));
