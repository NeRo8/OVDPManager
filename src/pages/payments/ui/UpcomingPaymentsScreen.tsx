import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, Section, Separator, screenContent } from '@/shared/ui';
import { PaymentRow } from '@/entities/portfolio';
import { useUpcomingPayments } from '../model/useUpcomingPayments.hook';
import { themeStyles } from '@/shared/theme';
import { plural } from '@/shared/lib';

export default function UpcomingPaymentsScreen() {
  const theme = themeStyles;
  const { holdingsCount, bonds, isFetching, error, refresh, upcoming, sections } =
    useUpcomingPayments();

  if (holdingsCount === 0) {
    return (
      <View style={[styles.center, theme.background]}>
        <Text style={[styles.emptyTitle, theme.text]}>Поки немає виплат</Text>
        <Text style={[styles.emptyText, theme.secondaryText]}>
          Додайте ОВДП або відновіть гаманець із резервної копії.
        </Text>
        <Button title="Додати ОВДП" onPress={() => router.push('/add')} style={styles.action} />
        <Button
          title="Відновити з копії"
          variant="secondary"
          onPress={() => router.navigate('/backup')}
          style={styles.action}
        />
      </View>
    );
  }

  if (!bonds) {
    return (
      <View style={[styles.center, theme.background]}>
        {error ? (
          <>
            <Text style={[styles.emptyTitle, theme.text]}>Немає зв’язку з НБУ</Text>
            <Text style={[styles.emptyText, theme.secondaryText]}>{error}</Text>
            <Button title="Спробувати ще раз" onPress={refresh} style={styles.action} />
          </>
        ) : (
          <ActivityIndicator />
        )}
      </View>
    );
  }

  return (
    <SectionList
      style={theme.background}
      contentContainerStyle={[screenContent, styles.listContent]}
      contentInsetAdjustmentBehavior="automatic"
      stickySectionHeadersEnabled={false}
      sections={sections}
      keyExtractor={(payment) => `${payment.isin}-${payment.date}-${payment.type}`}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refresh} />}
      ListHeaderComponent={
        <View style={styles.listHeader}>
          {error && (
            <Text style={[styles.inlineError, theme.dangerText]}>
              Не вдалося оновити дані НБУ — показано збережені.
            </Text>
          )}
          <Text style={[styles.count, theme.secondaryText]}>
            {upcoming.length}{' '}
            {plural(upcoming.length, 'майбутня виплата', 'майбутні виплати', 'майбутніх виплат')}
          </Text>
          <Section title="Переглянути детальніше">
            <NavRow title="Графік виплат по місяцях" href="/schedule" />
          </Section>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={[styles.month, theme.secondaryText]}>{section.title}</Text>
          <Text style={[styles.monthTotal, theme.secondaryText]}>{section.total}</Text>
        </View>
      )}
      renderItem={({ item, index, section }) => (
        <View
          style={[
            styles.paymentCard,
            theme.card,
            index === 0 && styles.firstPayment,
            index === section.data.length - 1 && styles.lastPayment,
          ]}
        >
          {index > 0 && <Separator />}
          <PaymentRow payment={item} showIsin />
        </View>
      )}
      ListEmptyComponent={
        <Text style={[styles.emptyList, theme.secondaryText]}>
          Майбутніх виплат за вашими ОВДП немає.
        </Text>
      }
      ListFooterComponent={
        <Text style={[styles.source, theme.secondaryText]}>
          Графік виплат — з депозитарію НБУ. Потягніть донизу, щоб оновити.
        </Text>
      }
    />
  );
}

function NavRow({ title, href }: { title: string; href: '/schedule' }) {
  const theme = themeStyles;
  return (
    <Pressable
      onPress={() => router.push(href)}
      accessibilityRole="link"
      style={({ pressed }) => [styles.linkRow, pressed && theme.muted]}
    >
      <Text style={[styles.linkText, theme.accentText]}>{title}</Text>
      <Text style={[styles.linkText, theme.secondaryText]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 21, maxWidth: 400 },
  action: { marginTop: 8, width: '100%', maxWidth: 400 },
  listContent: { gap: 0 },
  listHeader: { gap: 18, marginBottom: 6 },
  inlineError: { fontSize: 13, textAlign: 'center' },
  count: { fontSize: 15, textAlign: 'center' },
  sectionHeader: { marginHorizontal: 16, marginTop: 24, marginBottom: 6, gap: 2 },
  month: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.3 },
  monthTotal: { fontSize: 13 },
  paymentCard: { overflow: 'hidden' },
  firstPayment: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  lastPayment: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  emptyList: { fontSize: 15, textAlign: 'center', marginTop: 28 },
  source: { fontSize: 12, textAlign: 'center', marginTop: 24 },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  linkText: { fontSize: 16 },
});
