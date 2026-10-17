import { Stack, useLocalSearchParams } from 'expo-router';
import { Fragment, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DateField } from '@/components/date-field';
import { Button, InfoRow, Section, Separator, screenContent } from '@/components/ui';
import { formatDate, formatMoney, parseAmount, toISODate } from '@/lib/format';
import { addHolding, useHoldings } from '@/lib/holdings';
import { goBackOrHome } from '@/lib/navigation';
import { type Bond, nextPayment, positionPayments, round2, searchBonds } from '@/lib/ovdp';
import { useBonds } from '@/lib/use-bonds';
import { useColors } from '@/theme/colors';

export default function AddHoldingScreen() {
  const colors = useColors();
  // Set when opened with "Докупити" from a position: the bond is preselected.
  const { isin: topUpIsin } = useLocalSearchParams<{ isin?: string }>();
  const { bonds, byIsin, error, refresh } = useBonds();
  const holdings = useHoldings();
  const today = toISODate(new Date());

  const [query, setQuery] = useState(topUpIsin ?? '');
  const [selected, setSelected] = useState<Bond | null>(null);
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [amountText, setAmountText] = useState('');
  const [quantityText, setQuantityText] = useState('');

  // An exactly typed ISIN selects the bond without tapping a suggestion.
  const bond = selected ?? byIsin.get(query.trim().toUpperCase()) ?? null;
  const matches = useMemo(
    () => (bond || !bonds ? [] : searchBonds(bonds, query, today, 8)),
    [bond, bonds, query, today],
  );

  const ownedQuantity = bond
    ? holdings.filter((h) => h.isin === bond.isin).reduce((sum, h) => sum + h.quantity, 0)
    : 0;

  const amount = parseAmount(amountText);
  const quantity = Number(quantityText);
  const amountValid = Number.isFinite(amount) && amount > 0;
  const quantityValid = Number.isInteger(quantity) && quantity > 0;

  const dateProblem = !bond
    ? null
    : purchaseDate < bond.issueDate
      ? `ОВДП розміщена ${formatDate(bond.issueDate)} — дата купівлі не може бути раніше`
      : purchaseDate >= bond.maturityDate
        ? `ОВДП погашена ${formatDate(bond.maturityDate)}`
        : null;

  const preview = useMemo(() => {
    if (!bond || !quantityValid) return null;
    const payments = positionPayments(
      [{ id: 'preview', isin: bond.isin, purchaseDate, amount: 0, quantity }],
      bond,
      today,
    );
    const income = payments.reduce((sum, p) => sum + p.total, 0);
    return {
      next: nextPayment(payments),
      couponsLeft: payments.filter((p) => p.type === 'coupon' && !p.isPaid).length,
      income: round2(income),
    };
  }, [bond, quantityValid, purchaseDate, quantity, today]);

  const canSave = !!bond && !dateProblem && amountValid && quantityValid;

  function save() {
    if (!bond || !canSave) return;
    addHolding({ isin: bond.isin, purchaseDate, amount: round2(amount), quantity });
    goBackOrHome();
  }

  function onChangeQuery(text: string) {
    setQuery(text);
    setSelected(null);
  }

  const title = <Stack.Screen options={{ title: topUpIsin ? 'Докупити ОВДП' : 'Додати ОВДП' }} />;

  if (!bonds) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        {title}
        {error ? (
          <>
            <Text style={[styles.centerText, { color: colors.text }]}>{error}</Text>
            <Button title="Спробувати ще раз" onPress={refresh} style={styles.retry} />
          </>
        ) : (
          <>
            <ActivityIndicator />
            <Text style={[styles.centerText, { color: colors.secondaryText }]}>
              Завантажуємо перелік ОВДП з НБУ…
            </Text>
          </>
        )}
      </View>
    );
  }

  const currency = bond?.currency ?? 'UAH';
  const inputStyle = [styles.input, { color: colors.text }];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={screenContent}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      {title}
      <Section
        title="Номер ОВДП (ISIN)"
        footer={
          ownedQuantity > 0
            ? `У гаманці вже є ${ownedQuantity} шт — ця покупка додасться до них.`
            : undefined
        }
      >
        <TextInput
          value={bond && selected ? bond.isin : query}
          onChangeText={onChangeQuery}
          placeholder="Напр. UA4000227045 або 227045"
          placeholderTextColor={colors.secondaryText}
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus={!topUpIsin}
          style={inputStyle}
        />
        {matches.map((match) => (
          <Fragment key={match.isin}>
            <Separator />
            <Pressable
              onPress={() => setSelected(match)}
              style={({ pressed }) => [styles.match, pressed && { backgroundColor: colors.muted }]}
            >
              <Text style={[styles.matchIsin, { color: colors.text }]}>{match.isin}</Text>
              <Text style={[styles.matchInfo, { color: colors.secondaryText }]}>
                {match.rate}% · {match.currency} · до {formatDate(match.maturityDate)}
              </Text>
            </Pressable>
          </Fragment>
        ))}
        {!bond && query.trim().length >= 4 && matches.length === 0 && (
          <>
            <Separator />
            <Text style={[styles.hint, { color: colors.danger }]}>
              ОВДП з таким номером не знайдено
            </Text>
          </>
        )}
      </Section>

      {bond && (
        <>
          <Section title="Параметри випуску">
            <InfoRow label="Ставка купону" value={`${bond.rate}% річних`} />
            <Separator />
            <InfoRow label="Номінал" value={formatMoney(bond.nominal, bond.currency)} />
            <Separator />
            <InfoRow label="Купон на 1 шт" value={couponPerBond(bond)} />
            <Separator />
            <InfoRow label="Погашення" value={formatDate(bond.maturityDate)} />
          </Section>

          <Section
            title="Покупка"
            footer={
              dateProblem ? (
                <Text style={{ color: colors.danger }}>{dateProblem}</Text>
              ) : amountValid && quantityValid ? (
                `Ціна 1 шт: ${formatMoney(round2(amount / quantity), currency)}`
              ) : (
                'Кількість облігацій дивіться у застосунку банку чи брокера — від неї залежить сума купонів.'
              )
            }
          >
            <InfoRow
              label="Дата купівлі"
              value={
                <DateField value={purchaseDate} onChange={setPurchaseDate} maximumDate={today} />
              }
            />
            <Separator />
            <InfoRow
              label={`Сума, ${currency}`}
              value={
                <TextInput
                  value={amountText}
                  onChangeText={setAmountText}
                  placeholder="0,00"
                  placeholderTextColor={colors.secondaryText}
                  keyboardType="decimal-pad"
                  style={[styles.inlineInput, { color: colors.text }]}
                />
              }
            />
            <Separator />
            <InfoRow
              label="Кількість, шт"
              value={
                <TextInput
                  value={quantityText}
                  onChangeText={(text) => setQuantityText(text.replace(/\D/g, ''))}
                  placeholder={
                    amountValid ? `≈ ${Math.max(1, Math.round(amount / bond.nominal))}` : '0'
                  }
                  placeholderTextColor={colors.secondaryText}
                  keyboardType="number-pad"
                  style={[styles.inlineInput, { color: colors.text }]}
                />
              }
            />
          </Section>

          {preview && !dateProblem && (
            <Section title={ownedQuantity > 0 ? 'Що дасть ця покупка' : 'Що ви отримаєте'}>
              <InfoRow
                label="Наступна виплата"
                value={
                  preview.next
                    ? `${formatDate(preview.next.date)} · ${formatMoney(preview.next.total, currency)}`
                    : '—'
                }
              />
              <Separator />
              <InfoRow label="Купонів попереду" value={String(preview.couponsLeft)} />
              <Separator />
              <InfoRow label="Усього виплат" value={formatMoney(preview.income, currency)} />
              {amountValid && (
                <>
                  <Separator />
                  <InfoRow
                    label="Чистий дохід"
                    value={formatMoney(round2(preview.income - amount), currency)}
                  />
                </>
              )}
            </Section>
          )}

          <Button title="Зберегти" onPress={save} disabled={!canSave} />
        </>
      )}
    </ScrollView>
  );
}

function couponPerBond(bond: Bond): string {
  const coupon = bond.payments.find((p) => p.type === 'coupon');
  return coupon ? formatMoney(coupon.amount, bond.currency) : 'без купону';
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  centerText: { fontSize: 15, textAlign: 'center' },
  retry: { alignSelf: 'stretch' },
  input: {
    fontSize: 17,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontVariant: ['tabular-nums'],
  },
  inlineInput: {
    fontSize: 17,
    textAlign: 'right',
    minWidth: 120,
    paddingVertical: 4,
    fontVariant: ['tabular-nums'],
  },
  match: { paddingHorizontal: 16, paddingVertical: 10, gap: 2 },
  matchIsin: { fontSize: 16, fontWeight: '500', fontVariant: ['tabular-nums'] },
  matchInfo: { fontSize: 13 },
  hint: { fontSize: 14, paddingHorizontal: 16, paddingVertical: 12 },
});
