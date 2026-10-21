import { Stack, router } from 'expo-router';
import { SectionList, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { BondsUnavailable } from '@/entities/portfolio';
import { useBondPicker } from '@/features/add-holding';
import { formatDate } from '@/shared/lib';
import { LinkRow, SectionCell, SectionTitle, Typography, screenContent } from '@/shared/ui';

/** First step of adding a purchase: the bonds in circulation, searchable by ISIN. */
export default function BondPickerScreen() {
  const { bonds, error, refresh, today, query, setQuery, sections, ownedQuantity } =
    useBondPicker();

  if (!bonds) return <BondsUnavailable error={error} onRetry={refresh} />;

  return (
    <>
      <Stack.SearchBar
        placeholder="ISIN або його частина"
        autoCapitalize="characters"
        onChangeText={(event) => setQuery(event.nativeEvent.text)}
        onCancelButtonPress={() => setQuery('')}
      />
      <SectionList
        style={styles.list}
        contentContainerStyle={[screenContent, styles.content]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        stickySectionHeadersEnabled={false}
        sections={sections}
        keyExtractor={(bond) => bond.isin}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <SectionTitle title={section.title} />
          </View>
        )}
        renderItem={({ item: bond, index, section }) => {
          const owned = ownedQuantity.get(bond.isin);
          return (
            <SectionCell index={index} count={section.data.length}>
              <LinkRow
                title={bond.isin}
                subtitle={[
                  `${bond.rate}%`,
                  `${bond.maturityDate > today ? 'до' : 'погашена'} ${formatDate(bond.maturityDate)}`,
                  owned && `у гаманці ${owned} шт`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                onPress={() =>
                  router.push({ pathname: '/add/[isin]', params: { isin: bond.isin } })
                }
              />
            </SectionCell>
          );
        }}
        ListEmptyComponent={
          <Typography variant="subhead" tone="secondary" align="center" style={styles.empty}>
            {query.trim() ? 'ОВДП з таким номером не знайдено' : 'Немає ОВДП в обігу'}
          </Typography>
        }
      />
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  list: { backgroundColor: theme.background },
  content: { gap: 0 },
  sectionHeader: { marginTop: 24, marginBottom: 6 },
  empty: { marginTop: 28 },
}));
